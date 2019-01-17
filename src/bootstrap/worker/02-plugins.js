import config from 'config';
import * as plugins from 'plugins';

export default async function loadPlugins() {
	let pluginList = config.get('plugins');
	if (typeof pluginList === 'string') {
		pluginList = pluginList.split(',');
	}

	for (const pluginModule of pluginList) {
		plugins.load(pluginModule);
	}
}
