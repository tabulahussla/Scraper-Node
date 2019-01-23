let startTime = process.hrtime();
let diff;

import makeFolders from './00-make-folders';
import connectDatabases from './01-database';
import setupDiscovery from './02-discovery';
import setupCluster from './03-cluster';
import setupAPIServer from './04-api';
import publish from './05-publish';
import log from 'common/log';
import hrtimeToMsFixed from 'bootstrap/common/hrtime-to-ms';

export let isFinished;

export default async function bootstrapPipeline() {
	const beginningTime = startTime;

	diff = process.hrtime(startTime);
	log.info('bootstrap() +%d ms', hrtimeToMsFixed(diff));

	await bootStep(makeFolders, 'create_directories');
	await bootStep(connectDatabases, 'connect_databases');
	await bootStep(setupDiscovery, 'setup_service_discovery');
	await bootStep(setupCluster, 'setup_cluster');
	await bootStep(setupAPIServer, 'setup_api');
	await bootStep(publish, 'publish');

	isFinished = true;

	diff = process.hrtime(beginningTime);
	log.info('bootstrap finish in %d ms', hrtimeToMsFixed(diff));
}

async function bootStep(method, description = method.name) {
	startTime = process.hrtime();

	try {
		await method();
	} catch (err) {
		log.fatal('bootstrap failed on step "%s":', description);
		throw err;
	}

	diff = process.hrtime(startTime);
	log.info('%s() +%d ms', description, hrtimeToMsFixed(diff));
}
