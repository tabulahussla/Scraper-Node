import { initialize, listen, server } from '../api/server';
import config from 'config';
import log from 'common/log';

export default async function setupAPIServer() {
	const { type, tls, ...listenOptions } = config.get('api');
	const { secret } = config.get('jwt');
	initialize({ type, tls, secret });
	listen(listenOptions);

	server.server.once('listening', () => log.info('listening on %o', server.server.address()));

	printServiceHost();
}

export function printServiceHost() {
	const serviceHost = getServiceHost();
	log.debug('SERVICE HOST: %s', serviceHost);
}

export function getServiceHost() {
	const serviceNameEnv = (process.env.SERVICE_NAME || '').replace(/-/g, '_').toUpperCase();
	const serviceHostKey = serviceNameEnv + '_SERVICE_HOST';
	const serviceHost = process.env[serviceHostKey];

	return serviceHost;
}
