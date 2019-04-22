import cluster from "cluster";

let startTime = process.hrtime();
let diff;

import { hrtimeToMsec } from "~/bootstrap/common/hrtime";
import connectDatabases from "~/bootstrap/steps/database";
import log from "~/common/log";
import setupPlugins from "./steps/plugins";
import setupQueues from "./steps/queues";
import connectResourceBroker from "./steps/resource-broker";
import stats from "./steps/stats";

export const workerId = cluster.worker ? cluster.worker.id : 0;
export const FIXED_LENGTH = 6;

/**
 * @export
 * @param {WorkerInitOptions} options
 */
export default async function bootstrapWorker(options) {
	const beginningTime = startTime;

	diff = process.hrtime(startTime);
	log.info("bootstrap_worker() #%d +%d ms", workerId, hrtimeToMsec(diff).toFixed(FIXED_LENGTH));

	if (!cluster.isMaster) {
		await bootStep(connectDatabases, []);
	}
	await bootStep(setupPlugins, []);
	await bootStep(connectResourceBroker, []);
	await bootStep(setupQueues, [options.sites]);
	stats({ workerId });

	diff = process.hrtime(beginningTime);
	log.info(
		"bootstrap finish for worker #%d in %d ms",
		workerId,
		hrtimeToMsec(diff).toFixed(FIXED_LENGTH)
	);
}

async function bootStep(method, args, description = method.name) {
	startTime = process.hrtime();

	try {
		await method(...args);
	} catch (err) {
		log.fatal("bootstrap failed for worker #%d on step \"%s\":", workerId, description);
		throw err;
	}

	diff = process.hrtime(startTime);
	log.info(
		"%s() +%d ms (worker #%d)",
		description,
		hrtimeToMsec(diff).toFixed(FIXED_LENGTH),
		workerId
	);
}
