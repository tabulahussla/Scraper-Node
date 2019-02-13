import * as plugins from 'plugins';
import functions from './functions';
import agentPool from 'agency/agent-pool';
import { findPool } from 'resources/pools';
import resourceBrokerClient from 'resources/broker';
import registry from 'queues/registry';

export async function acquireAgent(job) {
	const agent = await agentPool.getOrCreateAgent({ queue: job.queue.name });

	return { agent };
}

export async function resolveResources({ required, allowedPools }) {
	const resources = {};

	for (const resourceType of required) {
		const poolId = findPool(resourceType, allowedPools);
		const resolved = await resourceBrokerClient().retrieve(poolId);

		if (!resolved) {
			throw new Error(`Cannot retreive "${resourceType}" resource from pool "${poolId}"`);
		}

		resources[resolved.type] = resolved;
	}

	return resources;
}

export async function acquireResources(job) {
	const queueConfig = registry.getQueueConfig(job.queue);
	const allowedPools = queueConfig.pools || [];
	const requiredResources = queueConfig.resources || [];

	if (requiredResources.length && !allowedPools.length) {
		throw new Error(
			'job handler has required resources but no pools available. check your config',
		);
	}

	return await resolveResources({
		required: requiredResources,
		allowedPools,
	});
}

export default async function process(job) {
	/** @type {Contract} */
	const contract = job.data;
	const { site, section } = contract;
	const manifest = plugins.getManifest(site, section);
	const handler = functions[manifest.mode];

	if (!manifest) {
		throw new Error(`Invalid site/section "${site}/${section}": no manifest`);
	}
	if (!handler) {
		throw new Error(
			`Invalid site/section "${site}/${section}": no handler for mode ${manifest.mode}`,
		);
	}

	let resources = {};
	if (manifest.mode === 'agent') {
		resources = await acquireAgent(job);
	} else if (manifest.mode === 'http') {
		resources = await acquireResources(job);
	}

	return await handler({ ...contract, ...resources });
}
