import log from 'common/log';

export const map = new Map();
export const plugins = new Set();

export function getHandler(...args) {
	const module = map.get(_key(...args));
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
		for (const section in modules[site]) {
			if (modules[site][section] instanceof Function) {
				map.set(_key(site, section), modules[site][section]);
			} else {
				for (const script in modules[site][section]) {
					map.set(_key(site, section, script), modules[site][section][script]);
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
