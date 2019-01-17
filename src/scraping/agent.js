import agentPool from 'agency/agent-pool';
import resourceBrokerClient from 'resources/broker';
import { findPool } from 'resources/pools';
import { validateException as isAgentBrokenException } from 'agency/validate';
import * as plugins from 'plugins';
import log from 'common/log';
import registry from 'queues/registry';

export default async function agentHandler(job) {
	const payload = parsePayload(job.data);

	const queueConfig = registry.getQueueConfig(job.queue);
	const allowedPools = queueConfig.pools || [];

	let agent = await agentPool.getOrCreateAgent({ queue: job.queue.name });

	try {
		await authentication({ agent, site: payload.site });

		const fetch = plugins.getScript(payload.site, payload.section, 'fetch');
		const result = await fetch({ agent, payload });

		return result;
	} catch (e) {
		if (
			isAgentBrokenException(e) ||
			!(await validation({ agent, site: payload.site, allowedPools }))
		) {
			try {
				agent && (await agent.destroy());
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
	const account = agent.account;

	if (!account) {
		log.trace('SKIP AUTHENTICATION FOR %s: agent has no account', site);
		return;
	}

	const verify = plugins.getScript(site, 'authentication', 'verify');
	const authorize = plugins.getScript(site, 'authentication', 'verify');

	if (!verify || !authorize) {
		log.trace('SKIP AUTHENTICATION FOR %s: no auth script', site);
		return;
	}

	if (!(await verify({ agent, account }))) {
		await authorize({ agent, account });
		if (!(await verify({ agent, account }))) {
			throw new Error('authentication failed');
		}
	}
}

export async function validation({ agent, site, allowedPools }) {
	const validate = plugins.getScript(site, 'validate');
	const { account, proxy } = await validate({ agent });

	if (!account && !proxy) {
		return false;
	}

	for (const bannedResource of [account, proxy]) {
		const poolId = findPool(bannedResource.type, allowedPools);
		await resourceBrokerClient.ban(bannedResource, poolId);
	}
}

export function parsePayload(payload) {
	return payload;
}
