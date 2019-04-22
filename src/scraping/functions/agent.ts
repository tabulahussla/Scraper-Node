import { validateException as isAgentBrokenException } from "~/agent/validate";
import log from "~/common/log";
import pause from "~/common/pause";
import * as plugins from "~/plugins";
import { resourceBroker } from "~/resources/broker";

export const RESOURCES_FREE_TIMEOUT = 5000;

export default async function agentHandler({ site, section, request, agent }) {
	try {
		await authentication({ agent, site });

		return await plugins.exec(site, section, "fetch", {
			agent,
			request,
			section,
			site,
		});
	} catch (e) {
		if (
			agent &&
			(isAgentBrokenException(e) || !(await validation({ agent, site })))
		) {
			try {
				if (agent) {
					await agent.destroy();
				}
				await pause(RESOURCES_FREE_TIMEOUT);
			} catch (err) {
				log.fatal({ err });
			}
			agent = null;
		}
		throw e;
	}
}

export async function authentication({ agent, site }) {
	const verify = plugins.resolveHandler(site, "authentication", "verify");
	const authorize = plugins.resolveHandler(
		site,
		"authentication",
		"authorize"
	);

	if (!verify || !authorize) {
		log.debug("SKIP AUTHENTICATION FOR %s: no script", site);
		return;
	}

	const account = agent.account;

	if (!account) {
		throw new Error("Agent has no account");
	}

	if (!(await verify({ agent, account }))) {
		await authorize({ agent, account });
		if (!(await verify({ agent, account }))) {
			await agent.dumpHtml(
				`AUTH_FAIL ${account.email} ${new Date()
					.toLocaleString("ru")
					.replace(/:/g, "-")}`
			);
			throw new Error("authentication failed");
		}
	}
}

export async function validation({ agent, site }) {
	const validate = plugins.resolveHandler(site, "validate");
	if (!validate) {
		log.trace("SKIP VALIDATION FOR %s: no script", site);
		return true;
	}

	const { account, proxy } = await validate({ agent });

	if (!account && !proxy) {
		return true;
	}

	for (const bannedResource of [account].filter(v => v)) {
		await resourceBroker.ban(bannedResource, bannedResource.poolId);
	}

	return false;
}
