import Queue from 'bee-queue';
import workers from 'scraping';
import log from 'common/log';
import redisClient from 'database/redis';
import queueRegistry from 'queues/registry';
import pause from 'common/pause';

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
export async function setupQueue(name, options) {
	options.settings = options.settings || {};
	const redis = options.settings.redis || redisClient;
	const queue = new Queue(name, { ...options.settings, redis });

	if (!(options.workerType in workers)) {
		throw new Error(`invalid worker type: "${options.workerType}"`);
	}

	if (process.env.DESTROY_QUEUES) {
		log.warn('DESTROYING QUEUE "%s"', name);
		await queue.destroy();
	}

	await pause(1000);

	const handler = workers[options.workerType];

	queue.process(options.concurrency, async job => {
		try {
			return await handler(job);
		} catch (err) {
			log.fatal({ err });
			throw err;
		}
	});

	queueRegistry.register(queue, options);
}
