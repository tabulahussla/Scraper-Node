import * as plugins from 'plugins';
import functions from './functions';
import agentPool from 'agent/factory';
import resourceBrokerClient from 'resources/broker';
import { DISABLE_PROXIES } from 'flags';
import config from 'config';

const QueueConfig = config.get('queues');

/**
 * Get resource from either specified pool
 *
 * @export
 * @param {string[]} pools
 *
 * TODO: move this method into resource broker client module
 */
export async function getResourceFromAnyPool(pools) {
	let resource;
	while (!resource && pools.length) {
		resource = await resourceBrokerClient().retrieve(pools.pop());
	}
	return resource;
}

export async function acquireResources(site) {
	let { resources } = QueueConfig[site];
	if (DISABLE_PROXIES) {
		const { proxy: ignored, ...other } = resources;
		resources = other;
	}
	const acquiredResources = {};
	for (const resourceType in resources) {
		const poolIds = resources[resourceType];
		const resolved = await getResourceFromAnyPool(poolIds);
		if (!resolved) {
			throw new Error(`Cannot retreive "${resourceType}" resource from pools "${poolIds}"`);
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
		return await handler({ ...contract, ...acquiredResources, agent });
	} finally {
		agent && (await agent.destroy());
	}
}
