let startTime = process.hrtime();
let diff;

import { hrtimeToMsec } from "~/bootstrap/common/hrtime";
import log from "~/common/log";
import setupCluster from "./steps/cluster";
import connectDatabases from "./steps/database";
import makeFolders from "./steps/make-folders";
import probe from "./steps/probe-server";

export let isFinished;
export const FIXED_LENGTH = 6;

export default async function bootstrapPipeline() {
	const beginningTime = startTime;

	diff = process.hrtime(startTime);
	log.info("bootstrap() +%d ms", hrtimeToMsec(diff).toFixed(FIXED_LENGTH));

	await bootStep(probe, "probe_server");
	await bootStep(makeFolders, "create_directories");
	await bootStep(connectDatabases, "connect_databases");
	await bootStep(setupCluster, "setup_cluster");

	isFinished = true;

	diff = process.hrtime(beginningTime);
	log.info("bootstrap finish in %d ms", hrtimeToMsec(diff).toFixed(FIXED_LENGTH));
}

async function bootStep(method, description = method.name) {
	startTime = process.hrtime();

	try {
		await method();
	} catch (err) {
		log.fatal("bootstrap failed on step \"%s\":", description);
		throw err;
	}

	diff = process.hrtime(startTime);
	log.info("%s() +%d ms", description, hrtimeToMsec(diff).toFixed(FIXED_LENGTH));
}
