import { findPool } from 'resources/pools';
import resourceBrokerClient from 'resources/broker';
import * as plugins from 'plugins';
import ProxyAgent from 'proxy-agent';
import stringifyProxy from 'common/stringify-proxy';
import log from 'common/log';
import registry from 'queues/registry';
import { jobStats } from 'stats';

export const proxyResource = 'proxy';
export const accountResource = 'account';

export default async function httpHandler(job) {
	jobStats(job);

	const payload = parsePayload(job.data);

	const { site, section, request } = payload;

	const queueConfig = registry.getQueueConfig(job.queue);
	const allowedPools = queueConfig.pools || [];
	const requiredResources = queueConfig.resources || [];

	if (requiredResources.length && !allowedPools.length) {
		throw new Error(
			'job handler has required resources but no pools available. check your config',
		);
	}

	const resourcesByType = {};
	const resolvedResources = [];
	let proxyAgent;

	try {
		await resolveResources({
			required: requiredResources,
			allowedPools,
			resourcesByType,
			resolvedResources,
		});
		if (resourcesByType[proxyResource]) {
			proxyAgent = new ProxyAgent(
				stringifyProxy(resourcesByType[proxyResource], { includeAuth: true }),
			);
		}
		await authentication({ proxyAgent, site, ...resourcesByType });

		const fetch = plugins.getHandler(site, section, 'fetch');

		if (!fetch) {
			throw new Error(
				`Invalid site/section: "${site}/${section}". No fetch script (${fetch})`,
			);
		}

		if (!(fetch instanceof Function)) {
			log.error('Fetch is not a function:', fetch);
		}

		const result = await fetch({ proxyAgent, request, ...resourcesByType });

		return result;
	} catch (e) {
		await validation({ proxyAgent, site, allowedPools, ...resourcesByType });
		throw e;
	} finally {
		for (const resource of resolvedResources) {
			try {
				await resourceBrokerClient().release(resource, resource.poolId);
			} catch (err) {
				log.error('failed to release resource %o', resource);
				log.error({ err });
			}
		}
	}
}

export async function resolveResources({
	required,
	allowedPools,
	resourcesByType,
	resolvedResources,
}) {
	for (const resource of required) {
		const poolId = findPool(resource, allowedPools);

		const resolved = await resourceBrokerClient().retrieve(poolId);

		if (!resolved) {
			throw new Error(`Cannot retreive "${resource}" resource from pool "${poolId}"`);
		}

		resourcesByType[resolved.type] = resolved;
		resolvedResources.push(resolved);
	}
}

export async function authentication({ proxyAgent, site, ...resources }) {
	if (!resources[accountResource]) {
		log.trace('SKIP AUTHENTICATION FOR %s: no account', site);
		return;
	}

	const verify = plugins.getHandler(site, 'authentication', 'verify');
	const authorize = plugins.getHandler(site, 'authentication', 'authorize');

	if (!verify || !authorize) {
		log.trace('SKIP AUTHENTICATION FOR %s: no auth script', site);
		return;
	}

	if (!(await verify({ proxyAgent, ...resources }))) {
		// TODO: SAVE CHANGES TO MODIFIED RESOURCES MAYBE?
		await authorize({ proxyAgent, ...resources });
		if (!(await verify({ proxyAgent, ...resources }))) {
			throw new Error('authentication failed');
		}
	}
}

export async function validation({ proxyAgent, site, allowedPools, ...resources }) {
	const validate = plugins.getHandler(site, 'validate');
	if (!validate) {
		return;
	}

	const { account, proxy } = await validate({ proxyAgent, ...resources });

	if (!account && !proxy) {
		return false;
	}

	for (const bannedResource of [account, proxy]) {
		const poolId = findPool(bannedResource.type, allowedPools);
		await resourceBrokerClient().ban(bannedResource, poolId);
	}
}

export function parsePayload(payload) {
	return payload;
}
