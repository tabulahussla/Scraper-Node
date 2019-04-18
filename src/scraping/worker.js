import * as plugins from 'plugins';
import functions from './functions';
import agentPool from 'agent/factory';
import { resourceBroker } from 'resources/broker';
import { DISABLE_PROXIES } from 'flags';
import config from 'config';
import harvest, { channel } from 'harvest';
import { sendWorkerMessage, EventEnum } from '@xxorg/maintenance-common';

const SiteConfig = config.get('sites');
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
		resources = resources.filter(({ type }) => type !== 'proxy');
	}
	const acquiredResources = {};
	for (const { type, pools } of resources) {
		const resolved = await getResourceFromAnyPool(pools);
		if (!resolved) {
			throw new Error(`Cannot retreive "${type}" resource from "${pools}"`);
		}
		acquiredResources[resolved.type] = resolved;
	}
	return acquiredResources;
}

/**
 * @export
 * @param {Contract} contract
 * @returns
 */
export default async function process(contract) {
	await sendWorkerMessage(channel, 'scraping', {
		event: EventEnum.OnBeforeScraping,
		contract,
	});

	const { site, section } = contract;
	const manifest = plugins.getManifest(site, section);

	if (!manifest) {
		throw new Error(`Invalid site/section "${site}/${section}": no manifest`);
	}

	const handler = functions[manifest.mode];

	if (!handler) {
		throw new Error(
			`Invalid site/section "${site}/${section}": no handler for mode ${manifest.mode}`,
		);
	}

	const acquiredResources = await acquireResources(site);

	let agent;
	if (manifest.mode === 'agent') {
		// @ts-ignore
		agent = await agentPool.createAgent(acquiredResources);
	}

	try {
		const artifact = await handler({ ...contract, ...acquiredResources, agent });
		await harvest(artifact, contract);
		await sendWorkerMessage(channel, 'scraping', {
			event: EventEnum.OnAfterScraping,
			artifact,
			contract,
		});
	} finally {
		agent && (await agent.destroy());
	}
}
