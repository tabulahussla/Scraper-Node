import cluster from 'cluster';

let now;
let [, startTime] = process.hrtime();

import connectDatabases from './00-database';
import setupQueues from './01-queues';
import log from 'common/log';

const workerId = cluster.worker.id;

/**
 * @export
 * @param {WorkerInitOptions} options
 */
export default async function bootstrapWorker(options) {
	const beginningTime = startTime;

	[, now] = process.hrtime();
	log.info('bootstrap() worker #%d +%d ms', workerId, nsToMs(now - startTime));

	await bootStep(connectDatabases, [], 'connect_databases');
	await bootStep(setupQueues, [options.queues], 'setup_queues');

	[, now] = process.hrtime();
	log.info('bootstrap finish for worker #%d in %d ms', workerId, nsToMs(now - beginningTime));
}

async function bootStep(method, args, description = method.name) {
	[, startTime] = process.hrtime();
	try {
		await method(...args);
	} catch (err) {
		log.fatal('bootstrap failed for worker #%d on step "%s":', workerId, description);
		throw err;
	}
	[, now] = process.hrtime();
	log.info('%s() +%d ms (worker #%d)', description, nsToMs(now - startTime), workerId);
}

function nsToMs(number) {
	return (number / 1000 / 1000).toFixed(6);
}
