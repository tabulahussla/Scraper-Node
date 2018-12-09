import Queue from 'bee-queue';
import workers from 'scraping';
import log from 'common/log';
import { workerId } from './index';

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
	const queue = new Queue(name);

	if (!(options.workerType in workers)) {
		throw new Error(`invalid worker type: "${options.workerType}`);
	}

	const handler = workers[options.workerType]({
		resourcesToLoad: options.resources,
	});

	queue.process(options.concurrency, handler);

	log.info(
		'processing %s jobs with %d concurrency on worker %d',
		name,
		options.concurrency,
		workerId,
	);
}
