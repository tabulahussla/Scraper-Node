import worker from 'scraping/worker';
import QueueHandler from 'queue-handler';

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
 * @param {string} queue
 * @param {SetupQueueOptions} options
 */
export async function setupQueue(queue, options) {
	const handler = new QueueHandler({
		concurrency: options.concurrency,
		queue,
		worker,
	});

	await handler.createChannel();
	await handler.consume();
}
