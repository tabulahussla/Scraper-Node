import agentPool from 'agency/agent-pool';
import resourceBrokerClient from 'resources/broker';
import { findPool } from 'resources/pools';
import { validateException as isAgentBrokenException } from 'agency/validate';
import * as plugins from 'plugins';
import log from 'common/log';
import registry from 'queues/registry';
import pause from 'common/pause';

const RESOURCES_FREE_TIMEOUT = 5000;

export default async function agentHandler(job) {
	const payload = parsePayload(job.data);
	const { site, section, request } = payload;

	const queueConfig = registry.getQueueConfig(job.queue);
	const allowedPools = queueConfig.pools || [];

	let agent = void 0;

	try {
		agent = await agentPool.getOrCreateAgent({ queue: job.queue.name });

		await authentication({ agent, site });

		return await plugins.exec(site, section, 'fetch', { agent, request, section, site });
	} catch (e) {
		if (
			agent &&
			(isAgentBrokenException(e) || !(await validation({ agent, site, allowedPools })))
		) {
			try {
				agent && (await agent.destroy());
				await pause(RESOURCES_FREE_TIMEOUT);
			} catch (err) {
				log.fatal({ err });
			}
			agent = null;
		}
		throw e;
	} finally {
		agent && agentPool.returnAgent(agent);
	}
}

export async function authentication({ agent, site }) {
	const verify = plugins.getHandler(site, 'authentication', 'verify');
	const authorize = plugins.getHandler(site, 'authentication', 'authorize');

	if (!verify || !authorize) {
		log.debug('SKIP AUTHENTICATION FOR %s: no script', site);
		return;
	}

	const account = agent.account;

	if (!account) {
		throw new Error('Agent has no account');
	}

	if (!(await verify({ agent, account }))) {
		await authorize({ agent, account });
		if (!(await verify({ agent, account }))) {
			throw new Error('authentication failed');
		}
	}
}

export async function validation({ agent, site, allowedPools }) {
	const validate = plugins.getHandler(site, 'validate');
	if (!validate) {
		log.trace('SKIP VALIDATION FOR %s: no script', site);
		return true;
	}

	const { account, proxy } = await validate({ agent });

	if (!account && !proxy) {
		return true;
	}

	for (const bannedResource of [account, proxy].filter(v => v)) {
		const poolId = findPool(bannedResource.type, allowedPools);
		await resourceBrokerClient().ban(bannedResource, poolId);
	}

	return false;
}

export function parsePayload(payload) {
	return payload;
}
