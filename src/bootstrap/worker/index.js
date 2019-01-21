import cluster from 'cluster';

let startTime = process.hrtime();
let diff;

import connectDatabases from './00-database';
import setupPlugins from './01-plugins';
import setupQueues from './02-queues';
import log from 'common/log';
import hrtimeToMsFixed from 'bootstrap/common/hrtime-to-ms';

export const workerId = cluster.worker ? cluster.worker.id : 0;

/**
 * @export
 * @param {WorkerInitOptions} options
 */
export default async function bootstrapWorker(options) {
	const beginningTime = startTime;

	diff = process.hrtime(startTime);
	log.info('bootstrap_worker() #%d +%d ms', workerId, hrtimeToMsFixed(diff));

	if (!cluster.isMaster) {
		await bootStep(connectDatabases, [], 'connect_databases');
	}
	await bootStep(setupPlugins, [], 'setup_plugins');
	await bootStep(setupQueues, [options.queues], 'setup_queues');

	diff = process.hrtime(beginningTime);
	log.info('bootstrap finish for worker #%d in %d ms', workerId, hrtimeToMsFixed(diff));
}

async function bootStep(method, args, description = method.name) {
	startTime = process.hrtime();

	try {
		await method(...args);
	} catch (err) {
		log.fatal('bootstrap failed for worker #%d on step "%s":', workerId, description);
		throw err;
	}

	diff = process.hrtime(startTime);
	log.info('%s() +%d ms (worker #%d)', description, hrtimeToMsFixed(diff), workerId);
}
