import agentPool from 'agency/agent-pool';
import { validateException } from 'agency/validate';
import * as scripts from 'scripts';
import log from 'common/log';

export default async function agentHandler(job) {
	const payload = parsePayload(job.data);

	let agent = await agentPool.getOrCreateAgent({ queue: job.queue.name });

	try {
		const { handler } = scripts.get(payload.site, payload.section);

		return await handler()({ agent, payload, log, require });
	} catch (e) {
		if (validateException(e)) {
			try {
				agent && await agent.destroy();
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

export function parsePayload(payload) {
	return payload;
}
