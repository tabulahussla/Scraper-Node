import Queue from 'bee-queue';
import workers from 'scraping';
import log from 'common/log';
import { workerId } from './index';
import redisClient from 'database/redis';

/**
 * @export
 * @param {{ [name: string]: SetupQueueOptions}} options
 */
export default async function setupQueues(options) {
	for (const queueName in options) {
		setupQueue(queueName, options[queueName]);
	}
}

/**
 * @export
 * @param {string} name
 * @param {SetupQueueOptions} options
 */
export function setupQueue(name, options) {
	options.settings = options.settings || {};
	const redis = options.settings.redis || redisClient;
	const queue = new Queue(name, { ...options.settings, redis });

	if (!(options.workerType in workers)) {
		throw new Error(`invalid worker type: "${options.workerType}`);
	}

	const handler = workers[options.workerType];

	queue.process(options.concurrency, async job => {
		try {
			return await handler(job);
		} catch (err) {
			log.fatal({ err });
			throw err;
		}
	});

	log.info(
		'processing %s jobs with %d concurrency on worker %d',
		name,
		options.concurrency,
		workerId,
	);
}
