const { join } = require('path');
const { readFileSync } = require('fs');
const pkg = require('./package.json');

const babelrc = JSON.parse(readFileSync('.babelrc'));
/**
 * @example
 * {
 *  "~": "./src"
 * }
 */
const pathPrefixes = getPathPrefixes();

require('@xxorg/dts-generator').default({
	prefix: pkg.name,
	name: pkg.name,
	main: pkg.name + '/src/index',
	project: __dirname,
	exclude: ['node_modules/**/*.d.ts', 'test/**/*'],
	out: 'dist/index.d.ts',
	declaredExternalModules: Object.keys(pkg.dependencies),
	resolveModuleImport(params) {
		for (const prefix in pathPrefixes) {
			const pathPrefix = pathPrefixes[prefix];
			if (params.importedModuleId.startsWith(prefix)) {
				const modulePath = params.importedModuleId.replace(
					prefix + '/',
					'',
				);
				return join(pkg.name, pathPrefix, modulePath);
			}
		}
		return null;
	},
});

function getPathPrefixes() {
	const prefixes = {};
	const [, moduleResolverPlugin] =
		babelrc.plugins.find(([name]) => name === 'module-resolver') || [];
	if (moduleResolverPlugin) {
		const { alias } = moduleResolverPlugin;
		for (const prefix in alias) {
			prefixes[prefix] = alias[prefix];
		}
	}
	return prefixes;
}
