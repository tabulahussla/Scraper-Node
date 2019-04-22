import { Channel } from "amqplib";
import log from "~/common/log";
import { amqpConnection } from "~/database/amqp";

export const RetryHeader = "_retries";

export default class QueueHandler {
	private queue: any;
	private concurrency: any;
	private worker: any;
	private retries: number;
	private channel: Channel | null = null;

	/**
	 * Creates an instance of QueueHandler.
	 *
	 * @param {object} options
	 * @param {number} options.concurrency
	 * @param {string} options.queue
	 * @param {(payload: any) => Promise<any>} options.worker
	 * @param {number} [options.retries]
	 * @memberof QueueHandler
	 */
	constructor({ concurrency, queue, worker, retries = 10 }) {
		this.queue = queue;
		this.concurrency = concurrency;
		this.worker = worker;
		this.retries = retries;
	}

	public async createChannel() {
		this.channel = await amqpConnection.createChannel();
	}

	public async consume() {
		if (this.channel === null) {
			throw new Error(
				"You must initialize channel before consuming a queue"
			);
		}
		log.debug(
			"consume \"%s\" queue (concurrency=%d)",
			this.queue,
			this.concurrency
		);
		await this.channel.prefetch(this.concurrency);
		await this.channel.assertQueue(this.queue);
		await this.channel.consume(this.queue, msg => {
			if (msg !== null) {
				this.consumeMessage(msg);
			}
		});
	}

	/**
	 * @param {amqp.ConsumeMessage} msg
	 * @memberof QueueHandler
	 */
	private async consumeMessage(msg) {
		log.debug(
			"consume message from \"%s\" queue: %o (headers: %o)",
			this.queue,
			msg.content.toString(),
			msg.properties.headers
		);

		let contract;
		try {
			// @ts-ignore
			contract = JSON.parse(msg.content);
		} catch (err) {
			log.error("failed to parse message", { err }, msg.content);
			this.channel!.nack(msg, false, false);
			return;
		}
		this.worker(contract)
			.then(() => {
				this.channel!.ack(msg);
			})
			.catch(err => {
				log.error("failed to process contract", { err }, contract);
				log.error(err);

				// retry
				let numTries = this.retries;
				if (RetryHeader in msg.properties.headers) {
					numTries = +msg.properties.headers[RetryHeader];
				}
				if (numTries > 0) {
					numTries -= 1;
					const headers = {
						...msg.properties.headers,
						[RetryHeader]: numTries,
					};
					this.channel!.sendToQueue(this.queue, msg.content, {
						headers,
					});
				}

				this.channel!.nack(msg, false, false);
			});
	}
}
