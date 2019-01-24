import ms from 'ms';
import config from 'config';
import { collection } from 'stats/index';
import log from 'common/log';

export default function workerStats({ workerId }) {
	const statsInterval = ms(config.get('stats').interval);
	setInterval(() => printStats(workerId), statsInterval);
}

export function printStats(workerId) {
	const object = collection.toJSON();
	for (let key in object) {
		log.info('𝞢 (w%s) %s: %o', workerId, key, object[key]);
	}
}
