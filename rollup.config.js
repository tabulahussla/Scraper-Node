import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/bundle.min.js',
		format: 'cjs',
	},
	plugins: [
		resolve({
			main: true,
			modulesOnly: true,
			sourcemap: 'inline',
		}),
		commonjs({}),
		json(),
		babel({
			// runtimeHelpers: true,
			exclude: 'node_modules/**', // only transpile our source code
		}),
	],
};
