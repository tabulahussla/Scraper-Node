// eslint-disable-next-line no-unused-vars
import amqp from 'amqplib';
import { amqpConnection } from 'database/amqp';
import log from 'common/log';

export const RetryHeader = '_retries';

export default class QueueHandler {
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
		this._queue = queue;
		this._concurrency = concurrency;
		this._worker = worker;
		this._retries = retries;
		/** @type {amqp.Channel} */
		this._channel = null;
	}

	async createChannel() {
		this._channel = await amqpConnection.createChannel();
	}

	async consume() {
		log.debug('consume "%s" queue (concurrency=%d)', this._queue, this._concurrency);
		await this._channel.prefetch(this._concurrency);
		await this._channel.assertQueue(this._queue);
		await this._channel.consume(this._queue, msg => {
			if (msg !== null) {
				this.consumeMessage(msg);
			}
		});
	}

	/**
	 * @param {amqp.ConsumeMessage} msg
	 * @memberof QueueHandler
	 */
	async consumeMessage(msg) {
		log.debug(
			'consume message from "%s" queue: %o (headers: %o)',
			this._queue,
			msg.content.toString(),
			msg.properties.headers,
		);

		let contract;
		try {
			// @ts-ignore
			contract = JSON.parse(msg.content);
		} catch (err) {
			log.error('failed to parse message', { err }, msg.content);
			this._channel.nack(msg, false, false);
			return;
		}
		this._channel.ack(msg);
		this._worker(contract).catch(err => {
			log.error('failed to process contract', { err }, contract);
			log.error(err);

			// retry
			let numTries = this._retries;
			if (RetryHeader in msg.properties.headers) {
				numTries = +msg.properties.headers[RetryHeader];
			}
			if (numTries > 0) {
				numTries -= 1;
				const headers = { ...msg.properties.headers, [RetryHeader]: numTries };
				this._channel.sendToQueue(this._queue, msg.content, { headers });
			}
		});
	}
}
