import QueueHandler from "~/queue-handler";
import worker from "~/scraping/worker";

/**
 * @export
 * @param {SiteConfig[]} sites
 */
export default async function setupQueues(sites) {
	for (const siteConfig of sites) {
		setupQueueForSite(siteConfig);
	}
}

/**
 * @export
 * @param {SiteConfig} siteConfig
 */
export async function setupQueueForSite(siteConfig) {
	const handler = new QueueHandler({
		concurrency: siteConfig.concurrency,
		queue: siteConfig.name,
		worker,
	});

	await handler.createChannel();
	await handler.consume();
}
