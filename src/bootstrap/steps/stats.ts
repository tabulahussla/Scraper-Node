import config from "config";
import ms from "ms";
import log from "~/common/log";
import { collection } from "~/stats/index";

export default function printStatsInterval() {
	const statConfiguration: { interval: string } = config.get("stats");
	const statsInterval: number = ms(statConfiguration.interval);
	setInterval(() => printStats(), statsInterval);
}

export function printStats() {
	const object = collection.toJSON() || {};
	const keys = Object.keys(object);
	if (keys.length) {
		for (const key of keys) {
			log.info("𝞢 %s: %o", key, object[key]);
		}
		log.info("┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉");
	}
}
