import config from "config";
import ms from "ms";
import log from "~/common/log";
import { name as projectName } from "~/project";
import { collection } from "~/stats/index";

export default function printStatsInterval({ workerId }) {
	const statConfiguration: { interval: string } = config.get("stats");
	const statsInterval: number = ms(statConfiguration.interval);
	setInterval(() => printStats(workerId), statsInterval);
}

export function printStats(workerId) {
	const object = collection.toJSON()[projectName] || {};
	const keys = Object.keys(object);
	if (keys.length) {
		for (const key of keys) {
			log.info("𝞢 (🚧%s) %s: %o", workerId, key, object[key]);
		}
		log.info("┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉");
	}
}
