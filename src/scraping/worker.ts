import { EventEnum, sendWorkerMessage } from "@xxorg/maintenance-common";
import config from "config";
import agentPool from "~/agent/factory";
import { DISABLE_PROXIES } from "~/flags";
import harvest, { channel } from "~/harvest";
import * as plugins from "~/plugins";
import { resourceBroker } from "~/resources/broker";
import { jobFailed, jobStarted, jobSucceeded } from "~/stats";
import functions from "./functions";

const SiteConfig = config.get("sites");
const SiteMap = getSiteMap(SiteConfig);

export function getSiteMap(siteConfig) {
	const map = new Map();
	for (const site of siteConfig) {
		map.set(site.name, site);
	}
	return map;
}

/**
 * Get resource from either specified pool
 *
 * @export
 * @param {string[]} pools
 *
 * TODO: move this method into resource broker client module
 */
export async function getResourceFromAnyPool(pools) {
	pools = [...pools];
	let resource;
	while (!resource && pools.length) {
		resource = await resourceBroker.retrieve(pools.pop());
	}
	return resource;
}

export async function acquireResources(site) {
	let { resources } = SiteMap.get(site);
	if (DISABLE_PROXIES) {
		resources = resources.filter(({ type }) => type !== "proxy");
	}
	const acquiredResources: IAcquiredResources = {};
	for (const { type, pools } of resources) {
		const resolved = await getResourceFromAnyPool(pools);
		if (!resolved) {
			throw new Error(
				`Cannot retreive "${type}" resource from "${pools}"`
			);
		}
		acquiredResources[resolved.type] = resolved;
	}
	return acquiredResources;
}

export async function reuseResoruces(acquiredResources: IAcquiredResources) {
	for (const type of Object.keys(acquiredResources)) {
		const resource: IResource = acquiredResources[type];
		await resourceBroker.release(resource, resource.poolId);
	}
}

/**
 * @export
 * @param {Contract} contract
 * @returns
 */
export default async function processContract(contract) {
	const startTime = process.hrtime();
	jobStarted(contract);

	await sendWorkerMessage(channel, "scraping", {
		event: EventEnum.OnBeforeScraping,
		contract,
	});

	const { site, section } = contract;
	const manifest = plugins.getManifest(site, section);

	if (!manifest) {
		throw new Error(
			`Invalid site/section "${site}/${section}": no manifest`
		);
	}

	const handler = functions[manifest.mode];

	if (!handler) {
		throw new Error(
			`Invalid site/section "${site}/${section}": no handler for mode ${
				manifest.mode
			}`
		);
	}

	const acquiredResources = await acquireResources(site);

	let agent;
	if (manifest.mode === "agent") {
		// @ts-ignore
		agent = await agentPool.createAgent(acquiredResources);
	}

	try {
		const artifact = await handler({
			...contract,
			...acquiredResources,
			agent,
		});
		await harvest(artifact, contract);
		await sendWorkerMessage(channel, "scraping", {
			event: EventEnum.OnAfterScraping,
			artifact,
			contract,
		});

		jobSucceeded(startTime, contract);
	} catch (err) {
		jobFailed(contract, err);
		throw err;
	} finally {
		if (agent) {
			await agent.destroy();
		}
	}
}
