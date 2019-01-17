export const plugins = new Set();

export function load(moduleName) {
	const module = require(moduleName);
	plugins.add(module);
}

export function getScript(site, section, type) {
	for (const plugin of plugins) {
		try {
			return plugin.getScript(site, section, type);
		} catch (e) {
			//
		}
	}

	return null;
}
