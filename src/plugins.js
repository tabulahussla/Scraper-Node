import log from 'common/log';

export const map = new Map();
export const plugins = new Set();

function resolveDefault(m) {
	return m.default || m;
}

export function getHandler(...args) {
	const module = map.get(_key(...args));
	log.trace('get %s: %o', args.join('/'), module);
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
