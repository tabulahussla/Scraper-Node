import { workerId } from 'bootstrap/worker';
import log from 'common/log';
import clone from 'clone';

export default class QueueRegistry {
	constructor(queueConfig) {
		this._queueConfig = clone(queueConfig);
		this._queues = {};

		for (let key in this._queueConfig) {
			this._queueConfig[key].desiredConcurrency = this._queueConfig[key].concurrency;
			this._queueConfig[key].concurrency = 0;
		}
	}

	register(queue, options) {
		if (!this._queueConfig[queue.name]) {
			this._queueConfig[queue.name] = {};
		}

		this._queues[queue.name] = queue;
		this._queueConfig[queue.name].registered = true;
		this._queueConfig[queue.name].concurrency += options.concurrency;
		this._queueConfig[queue.name].settings = {
			...queue.settings,
			redis: getRedisConfig(queue.settings.redis),
		};

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

	/**
	 * @param {*} name
	 * @returns {import('bee-queue')}
	 * @memberof QueueRegistry
	 */
	getQueue(name) {
		return this._queues[name];
	}

	getQueueConfig(nameOrQueue) {
		const name = (nameOrQueue && nameOrQueue.name) || nameOrQueue;
		return name ? this._queueConfig[name] : this._queueConfig;
	}
}

export function getRedisConfig(redisClient) {
	return redisClient.options || redisClient;
}
