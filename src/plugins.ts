import log from "~/common/log";

export const map = new Map<string, any>();
export const plugins = new Set<IPlugin>();

export function getDefaultExport(obj) {
	return (obj && obj.default) || obj;
}

export function resolveHandler(...keyPath: string[]) {
	return map.get(serializeKey(...keyPath));
}

export async function exec(...args) {
	const command = args.pop();
	const module = resolveHandler(...args);

	if (!module) {
		throw new Error(
			`Invalid path: "${args}". No handler found in any plugin`
		);
	}

	while (args.length >= 1) {
		args.pop();
		const parentMiddleware = resolveHandler(...args, "middleware");
		if (parentMiddleware) {
			log.debug("RUN %s MIDDLEWARE", args);
			await parentMiddleware(command);
		}
	}

	return module(command);
}

export function getManifest(site, section) {
	const defaultManifestModule = resolveHandler(site, section, "manifest");
	const mainModule = resolveHandler(site, section);

	return defaultManifestModule || (mainModule && mainModule.manifest);
}

function getByPath(obj, ...path) {
	if (!path.length) {
		return obj.default || obj;
	}
	return getByPath(obj[path[0]], ...path.slice(1));
}

export function registerModule(plugin, ...key) {
	map.set(
		serializeKey(...key),
		getDefaultExport(getByPath(plugin.modules, ...key))
	);
	log.trace("+%s: %o", serializeKey(...key), map.get(serializeKey(...key)));
}

export function loadPlugin(plugin: IPlugin) {
	const { sites, modules } = plugin;
	plugins.add(plugin);

	for (const site of sites) {
		log.trace("%s:", site);
		for (const section of Object.keys(modules[site])) {
			log.trace("\t%s:", section);
			if (getDefaultExport(modules[site][section]) instanceof Function) {
				registerModule(plugin, site, section);
			} else {
				for (const script of Object.keys(modules[site][section])) {
					registerModule(plugin, site, section, script);
				}
			}
		}
	}
}

export function loadPluginModule(name) {
	const plugin = getDefaultExport(require(name)) as IPlugin;
	loadPlugin(plugin);

	log.debug("LOADED PLUGIN %s", name);
}

export const SEP = "/";

export function serializeKey(...args) {
	return args.join(SEP);
}

export function parseKey(key) {
	return key.split(SEP);
}
