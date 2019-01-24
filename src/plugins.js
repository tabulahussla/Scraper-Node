import log from 'common/log';

export const map = new Map();
export const plugins = new Set();

export function getHandler(...args) {
	const module = map.get(_key(...args));
	log.trace('get %s: %o', args.join('/'), module);
	if (!module) {
		return module;
	}
	return module.default || module;
}

export function load(name) {
	const plugin = require(name);

	const { sites, modules } = plugin;
	plugins.add(plugin);

	log.debug('LOAD PLUGIN %s: sites - %o', name, sites);

	for (const site of sites) {
		log.trace('%s:', site);
		for (const section in modules[site]) {
			log.trace('\t%s:', section);
			if (modules[site][section] instanceof Function) {
				map.set(_key(site, section), modules[site][section]);
				log.trace('+%s/%s', site, section);
			} else {
				for (const script in modules[site][section]) {
					map.set(_key(site, section, script), modules[site][section][script]);
					log.trace('+%s/%s/%s', site, section, script);
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
