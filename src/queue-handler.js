// eslint-disable-next-line no-unused-vars
import amqp from 'amqplib';
import { amqpConnection } from 'database/amqp';
import log from 'common/log';

export default class QueueHandler {
	/**
	 * Creates an instance of QueueHandler.
	 *
	 * @param {object} options
	 * @param {number} options.concurrency
	 * @param {string} options.queue
	 * @param {(payload: any) => Promise<any>} options.worker
	 * @memberof QueueHandler
	 */
	constructor({ concurrency, queue, worker }) {
		this._queue = queue;
		this._concurrency = concurrency;
		this._worker = worker;
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
				this._process(msg)
					.then(() => this._channel.ack(msg))
					.catch(err => {
						log.error(err);
						this._channel.nack(msg);
					});
			}
		});
	}

	/**
	 * @param {amqp.ConsumeMessage | null} msg
	 * @memberof QueueHandler
	 */
	async _process(msg) {
		// @ts-ignore
		const contract = JSON.parse(msg.content);
		await this._worker(contract);
	}
}
