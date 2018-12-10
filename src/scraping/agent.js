import agentPool from 'agency/agent-pool';
import { validateException } from 'agency/validate';
import * as scripts from 'scripts';
import log from 'common/log';

export default async function agentHandler(job) {
	const payload = parsePayload(job.data);

	let agent = await agentPool.getOrCreateAgent({ queue: job.queue.name });

	const preHandlers = [
		scripts.get(payload.site, '', scripts.RegisterMode.pre),
		scripts.get(payload.site, payload.section, scripts.RegisterMode.pre),
	].filter(v => v);

	const postHandlers = [
		scripts.get(payload.site, '', scripts.RegisterMode.post),
		scripts.get(payload.site, payload.section, scripts.RegisterMode.post),
	].filter(v => v);

	try {
		for (let { handler } of preHandlers) {
			handler && (await handler({ agent, payload, log, require }));
		}

		let { handler } = scripts.get(payload.site, payload.section, scripts.RegisterMode.default);

		const result = await handler({ agent, payload, log, require });

		for ({ handler } of postHandlers) {
			handler && (await handler({ agent, payload, log, require, result }));
		}

		return result;
	} catch (e) {
		if (validateException(e)) {
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

export function parsePayload(payload) {
	return payload;
}
