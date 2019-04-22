import config from "config";
import QueueHandler from "~/queue-handler";
import worker from "~/scraping/worker";

export const ConsumedQueues: string[] = [];

export default async function consumeQueues() {
	const siteConfiguration: SiteConfig[] = config.get("sites");
	for (const siteConfig of siteConfiguration) {
		await consumeQueueForSite(siteConfig);
	}
}

export async function consumeQueueForSite(siteConfig: SiteConfig) {
	const handler = new QueueHandler({
		concurrency: siteConfig.concurrency,
		queue: siteConfig.name,
		worker,
	});

	await handler.createChannel();
	await handler.consume();

	ConsumedQueues.push(siteConfig.name);
}
