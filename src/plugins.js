import log from 'common/log';

export const map = new Map();
export const plugins = new Set();

function resolveDefault(m) {
	return m.default || m;
}

export async function exec(...args) {
	const command = args.pop();
	const module = resolveModuleDefault(...args);

	if (!module) {
		throw new Error(`Invalid path: "${args}". No handler found in any plugin`);
	}

	while (args.length >= 1) {
		args.pop();
		const parentMiddleware = resolveModuleDefault(...args, 'middleware');
		if (parentMiddleware) {
			log.debug('RUN %s MIDDLEWARE', args);
			await parentMiddleware(command);
		}
	}

	return module(command);
}

export function getThatOrDefault(obj) {
	return (obj && obj.default) || obj;
}

export function resolveModuleDefault(...args) {
	return getThatOrDefault(resolveModule(...args));
}

export function getManifest(site, section) {
	const defaultManifestModule = resolveModuleDefault(site, section, 'manifest');
	const mainModule = resolveModule(site, section);

	return defaultManifestModule || (mainModule && mainModule.manifest);
}

export function resolveModule(...args) {
	const module = map.get(_key(...args));
	if (module) {
		return module;
	}
}

function resolvePath(obj, ...path) {
	if (!path.length) {
		return obj.default || obj;
	}
	return resolvePath(obj[path[0]], ...path.slice(1));
}

export function registerModule(plugin, ...key) {
	map.set(_key(...key), resolveDefault(resolvePath(plugin.modules, ...key)));
	log.trace('+%s: %o', _key(...key), map.get(_key(...key)));
}

export function load(name) {
	const plugin = require(name);

	const { sites, modules } = plugin.default || plugin;
	plugins.add(plugin);

	log.debug('LOAD PLUGIN %s: sites - %o', name, sites);

	for (const site of sites) {
		log.trace('%s:', site);
		for (const section in modules[site]) {
			log.trace('\t%s:', section);
			if (resolveDefault(modules[site][section]) instanceof Function) {
				registerModule(plugin, site, section);
			} else {
				for (const script in modules[site][section]) {
					registerModule(plugin, site, section, script);
				}
			}
		}
	}
}

export const SEP = '/';

export function _key(...args) {
	return args.join(SEP);
}

export function _unkey(key) {
	return key.split(SEP);
}
