import config from 'config';
// @ts-ignore
import { findPool } from 'resources/pools';
// @ts-ignore
import resourceBrokerClient from 'resources/broker';
import * as scripts from 'scripts';
// @ts-ignore
import ProxyAgent from 'proxy-agent';
import stringifyProxy from 'common/stringify-proxy';
import log from 'common/log';

const queueConfig = config.get('queues');

export default async function httpHandler(job) {
	const payload = parsePayload(job.data);
	const configForQueue = queueConfig[job.queue.name] || {};
	const allowedPools = configForQueue.pools || [];
	const requiredResources = configForQueue.resources || [];

	if (requiredResources.length && !allowedPools.length) {
		throw new Error(
			'job handler has required resources but no pools available. check your config',
		);
	}

	const resources = [];
	let proxyAgent;

	for (const resource of requiredResources) {
		const poolId = findPool(resource, allowedPools);

		const resolved = await resourceBrokerClient.getResource(poolId);

		if (!resolved) {
			continue;
		}

		// @ts-ignore
		resolved.poolId = poolId;
		resources.push(resolved);

		if (resource === 'proxy') {
			proxyAgent = new ProxyAgent(stringifyProxy(resolved, { includeAuth: true }));
		}
	}

	const preHandlers = [
		scripts.get(payload.site, '', scripts.RegisterMode.pre),
		scripts.get(payload.site, payload.section, scripts.RegisterMode.pre),
	].filter(v => v);

	const postHandlers = [
		scripts.get(payload.site, '', scripts.RegisterMode.post),
		scripts.get(payload.site, payload.section, scripts.RegisterMode.post),
	].filter(v => v);

	try {
		for (const required of requiredResources) {
			if (!resources.find(resource => resource.type === required)) {
				throw new Error('cannot resolve all resources');
			}
		}

		for (let { handler } of preHandlers) {
			handler && (await handler({ resources, proxyAgent, payload, log, require }));
		}

		let { handler } = scripts.get(payload.site, payload.section, scripts.RegisterMode.default);

		const result = await handler({ resources, proxyAgent, payload, log, require });

		for ({ handler } of postHandlers) {
			handler && (await handler({ resources, proxyAgent, payload, log, require, result }));
		}
	
		return result;
	} catch (e) {
		throw e;
	} finally {
		for (const resource of resources) {
			// @ts-ignore
			await resourceBrokerClient.returnResource(resource, resource.poolId);
		}
	}
}

export function parsePayload(payload) {
	return payload;
}
