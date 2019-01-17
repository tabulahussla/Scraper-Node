import { findPool } from 'resources/pools';
import resourceBrokerClient from 'resources/broker';
import * as plugins from 'plugins';
import ProxyAgent from 'proxy-agent';
import stringifyProxy from 'common/stringify-proxy';
import log from 'common/log';
import registry from 'queues/registry';

export default async function httpHandler(job) {
	const payload = parsePayload(job.data);
	const queueConfig = registry.getQueueConfig(job.queue);
	const allowedPools = queueConfig.pools || [];
	const requiredResources = queueConfig.resources || [];

	if (requiredResources.length && !allowedPools.length) {
		throw new Error(
			'job handler has required resources but no pools available. check your config',
		);
	}

	const resources = [];
	let proxyAgent;

	for (const resource of requiredResources) {
		const poolId = findPool(resource, allowedPools);

		const resolved = await resourceBrokerClient.retrieve(poolId);

		if (!resolved) {
			continue;
		}

		resolved.poolId = poolId;
		resources.push(resolved);

		if (resource === 'proxy') {
			proxyAgent = new ProxyAgent(stringifyProxy(resolved, { includeAuth: true }));
		}
	}

	try {
		for (const required of requiredResources) {
			if (!resources.find(resource => resource.type === required)) {
				throw new Error('cannot resolve all resources');
			}
		}
		const fetch = plugins.getScript(payload.site, payload.section, 'fetch');
		const fetchOptions = { proxyAgent, payload };
		for (const resource of resources) {
			fetchOptions[resource.type] = resource;
		}
		const result = await fetch(fetchOptions);

		return result;
	} catch (e) {
		throw e;
	} finally {
		for (const resource of resources) {
			try {
				await resourceBrokerClient.release(resource, resource.poolId);
			} catch (err) {
				log.error('failed to release resource %o', resource);
				log.error({ err });
			}
		}
	}
}

export function parsePayload(payload) {
	return payload;
}
