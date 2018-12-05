let now;
let [, startTime] = process.hrtime();

import makeFolders from './00-make-folders';
import connectDatabases from './01-database';
import log from 'common/log';

export default async function bootstrapPipeline() {
	const beginningTime = startTime;

	[, now] = process.hrtime();
	log.info('bootstrap() +%d ms', nsToMs(now - startTime));

	await bootStep(makeFolders, 'create_directories');
	await bootStep(connectDatabases, 'connect_databases');

	[, now] = process.hrtime();
	log.info('bootstrap finish in %d ms', nsToMs(now - beginningTime));
}

async function bootStep(method, description = method.name) {
	[, startTime] = process.hrtime();
	try {
		await method();
	} catch (err) {
		log.fatal('bootstrap failed on step "%s":', description);
		throw err;
	}
	[, now] = process.hrtime();
	log.info('%s() +%d ms', description, nsToMs(now - startTime));
}

function nsToMs(number) {
	return (number / 1000 / 1000).toFixed(6);
}
