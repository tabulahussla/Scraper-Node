import log from 'common/log';

export const map = new Map();
export const plugins = new Set();

function resolveDefault(m) {
	return m.default || m;
}

export async function exec(...args) {
	const command = args.pop();
	const module = getHandler(...args);

	if (!module) {
		throw new Error(`Invalid path: "${args}". No handler found in any plugin`);
	}

	while (args.length >= 1) {
		// pop it until it reaches /site/* complexity then inject */middleware last time
		args.pop();
		const parentMiddleware = getHandler(...args, 'middleware');
		if (parentMiddleware) {
			await parentMiddleware(command);
		}
	}

	return module(command);
}

export function getHandler(...args) {
	const module = map.get(_key(...args));
	if (!module) {
		return module;
	}
	return module.default || module;
}

function resolve(obj, ...path) {
	if (!path.length) {
		return obj.default || obj;
	}
	return resolve(obj[path[0]], ...path.slice(1));
}

export function registerHandler(plugin, ...key) {
	map.set(_key(...key), resolveDefault(resolve(plugin.modules, ...key)));
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
				registerHandler(plugin, site, section);
			} else {
				for (const script in modules[site][section]) {
					registerHandler(plugin, site, section, script);
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
