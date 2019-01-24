import cluster from 'cluster';

let startTime = process.hrtime();
let diff;

import connectDatabases from 'bootstrap/steps/database';
import setupPlugins from './steps/plugins';
import setupQueues from './steps/queues';
import printStats from './steps/stats';
import log from 'common/log';
import { hrtimeToMsec } from 'bootstrap/common/hrtime';

export const workerId = cluster.worker ? cluster.worker.id : 0;
export const FIXED_LENGTH = 6;

/**
 * @export
 * @param {WorkerInitOptions} options
 */
export default async function bootstrapWorker(options) {
	const beginningTime = startTime;

	diff = process.hrtime(startTime);
	log.info('bootstrap_worker() #%d +%d ms', workerId, hrtimeToMsec(diff).toFixed(FIXED_LENGTH));

	if (!cluster.isMaster) {
		await bootStep(connectDatabases, []);
	}
	await bootStep(setupPlugins, []);
	await bootStep(setupQueues, [options.queues]);
	printStats({ workerId });

	diff = process.hrtime(beginningTime);
	log.info(
		'bootstrap finish for worker #%d in %d ms',
		workerId,
		hrtimeToMsec(diff).toFixed(FIXED_LENGTH),
	);
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
	log.info(
		'%s() +%d ms (worker #%d)',
		description,
		hrtimeToMsec(diff).toFixed(FIXED_LENGTH),
		workerId,
	);
}
