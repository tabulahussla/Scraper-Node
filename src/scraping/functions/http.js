import resourceBrokerClient from 'resources/broker';
import * as plugins from 'plugins';
import ProxyAgent from 'proxy-agent';
import stringifyProxy from 'common/stringify-proxy';
import log from 'common/log';

export const proxyResource = 'proxy';
export const accountResource = 'account';

export default async function httpHandler({ site, section, request, proxy, account }) {
	const resources = { proxy, account };

	let proxyAgent;
	if (resources[proxyResource]) {
		proxyAgent = new ProxyAgent(
			stringifyProxy(resources[proxyResource], { includeAuth: true }),
		);
	}

	try {
		await authentication({ proxyAgent, site, ...resources });

		return await plugins.exec(site, section, 'fetch', {
			site,
			section,
			request,
			proxyAgent,
			...resources,
		});
	} catch (e) {
		await validation({ proxyAgent, site, ...resources });
		throw e;
	} finally {
		for (const resource of Object.values(resources)) {
			if (!resource) continue;
			try {
				await resourceBrokerClient().release(resource, resource.poolId);
			} catch (err) {
				log.error('failed to release resource %o', resource);
				log.error({ err });
			}
		}
	}
}

export async function authentication({ proxyAgent, site, ...resources }) {
	if (!resources[accountResource]) {
		log.trace('SKIP AUTHENTICATION FOR %s: no account', site);
		return;
	}

	const verify = plugins.resolveModuleDefault(site, 'authentication', 'verify');
	const authorize = plugins.resolveModuleDefault(site, 'authentication', 'authorize');

	if (!verify || !authorize) {
		log.trace('SKIP AUTHENTICATION FOR %s: no auth script', site);
		return;
	}

	if (!(await verify({ proxyAgent, ...resources }))) {
		await authorize({ proxyAgent, ...resources });
		if (!(await verify({ proxyAgent, ...resources }))) {
			throw new Error('authentication failed');
		}
		await saveAuthResult(resources[accountResource]);
	}
}

export async function saveAuthResult(account) {
	await resourceBrokerClient().modify(account, {
		$set: {
			authResult: account.authResult,
		},
	});
}

export async function validation({ proxyAgent, site, ...resources }) {
	const validate = plugins.resolveModuleDefault(site, 'validate');
	if (!validate) {
		return;
	}

	const { account, proxy } = await validate({ proxyAgent, ...resources });

	if (!account && !proxy) {
		return;
	}
}
