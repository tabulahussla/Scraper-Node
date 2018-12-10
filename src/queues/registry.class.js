import { workerId } from 'bootstrap/worker';
import log from 'common/log';
import clone from 'clone';

export default class QueueRegistry {
	constructor(queueConfig) {
		this._queueConfig = clone(queueConfig);

		for (let key in this._queueConfig) {
			this._queueConfig[key].desiredConcurrency = this._queueConfig[key].concurrency;
			this._queueConfig[key].concurrency = 0;
		}
	}

	register(queue, options) {
		if (!this._queueConfig[queue.name]) {
			this._queueConfig[queue.name] = {};
		}

		this._queueConfig[queue.name].registered = true;
		this._queueConfig[queue.name].concurrency += options.concurrency;

		log.info(
			'register "%s" queue with %d concurrency on worker %d',
			queue.name,
			options.concurrency,
			workerId,
		);
	}

	isRegistered(queue) {
		const config = this._queueConfig[queue.name] || {};

		return config.registered || false;
	}

	getAvailableQueues() {
		return this._queueConfig;
	}
}
