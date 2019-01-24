import agentPool from 'agency/agent-pool';
import resourceBrokerClient from 'resources/broker';
import { findPool } from 'resources/pools';
import { validateException as isAgentBrokenException } from 'agency/validate';
import * as plugins from 'plugins';
import log from 'common/log';
import registry from 'queues/registry';
import { jobStats } from 'stats';

export default async function agentHandler(job) {
	jobStats(job);

	const payload = parsePayload(job.data);
	const { site, section, request } = payload;

	const queueConfig = registry.getQueueConfig(job.queue);
	const allowedPools = queueConfig.pools || [];

	let agent = await agentPool.getOrCreateAgent({ queue: job.queue.name });

	try {
		await authentication({ agent, site });

		const fetch = plugins.getHandler(site, section, 'fetch');

		if (!fetch) {
			throw new Error(
				`Invalid site/section: "${site}/${section}". No fetch script (${fetch})`,
			);
		}

		if (!(fetch instanceof Function)) {
			log.error('Fetch is not a function:', fetch);
		}

		const result = await fetch({ agent, request });

		// TMP: HACK: TODO: trigger succeded event to update job stats
		job.emit('succeeded', result);
		return result;
	} catch (e) {
		if (isAgentBrokenException(e) || !(await validation({ agent, site, allowedPools }))) {
			try {
				agent && (await agent.destroy());
			} catch (err) {
				log.fatal({ err });
			}
			agent = null;
		}
		// TMP: HACK: TODO: trigger succeded event to update job stats
		job.emit('failed', e);
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
