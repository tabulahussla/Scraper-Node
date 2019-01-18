import jstp from '@metarhia/jstp';
import { readFileSync } from 'fs';
import authPolicy from './jwt-auth-policy';
import isEmptyObject from '../common/is-empty-object';

export const ApplicationName = 'scraping-system';
export const SecureServerType = ['wss', 'tls'];
export const ValidOptions = 'false (to disable tls), { key: string|Buffer, cert: string|Buffer }';

/**
 * @export
 * @class APIServer
 */
export default class APIServer {
	/**
	 * Creates an instance of APIServer.
	 *
	 * @param {Object} options
	 * @param {string} options.type
	 * @param {false|{cert:string|Buffer,key:string|Buffer}} [options.tls=false]
	 * @param {{[serviceName: string]: Function}} options.services
	 * @memberof APIServer
	 */
	constructor({ type = 'ws', tls = false, services }) {
		this._services = services;
		this._serverType = type;
		this._tlsOptions = tls;
		this._createApplication();
		this._createServer();
	}

	get server() {
		return this._server;
	}

	listen(options) {
		this._server.listen(options);
	}

	close() {
		this._server.close();
	}

	_createApplication() {
		this._application = new jstp.Application(ApplicationName, this._services);
	}

	_createServer() {
		/* PREPARE SERVER OPTIONS */

		/** @type {any} */
		let tlsOptions = this._tlsOptions;
		let serverType = this._serverType;
		if (tlsOptions !== false && !isEmptyObject(tlsOptions)) {
			if (!tlsOptions.key || !tlsOptions.cert) {
				throw new Error(
					`Invalid tls options: ${tlsOptions}. Valid options are: ${ValidOptions}`,
				);
			}
			if (!SecureServerType.includes(serverType)) {
				throw new Error(
					`Insecure server type "${serverType}" but tls options are specified`,
				);
			}

			if (!(tlsOptions.key instanceof Buffer)) {
				tlsOptions.key = readFileSync(tlsOptions.key);
			}
			if (!(tlsOptions.cert instanceof Buffer)) {
				tlsOptions.cert = readFileSync(tlsOptions.cert);
			}
		} else {
			tlsOptions = {};
		}

		/* INITIALIZE THE SERVER */

		if (!(serverType in jstp)) {
			throw new Error(`Invalid server type "${serverType}"`);
		}

		/** @type {import('@metarhia/jstp').Server} */
		this._server = jstp[serverType].createServer({
			applications: [this._application],
			...tlsOptions,
			authPolicy,
		});

		this._server.on('disconnect', connection => {
			this._cleanup(connection);
		});
	}

	// eslint-disable-next-line no-unused-vars
	_cleanup(connection) {}
}
