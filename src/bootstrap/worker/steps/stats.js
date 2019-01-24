import ms from 'ms';
import config from 'config';
import { collection } from 'stats/index';
import { name as projectName } from 'project';
import log from 'common/log';

export default function printStatsInterval() {
	const statsInterval = ms(config.get('stats').interval);
	setInterval(() => printStats(), statsInterval);
}

export function printStats() {
	const object = collection.toJSON()[projectName] || {};
	for (let key in object) {
		log.info('𝞢 %s: %o', key, object[key]);
	}
	log.info('┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉');
}
