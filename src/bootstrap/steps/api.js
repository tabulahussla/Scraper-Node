import { initialize, server } from '../../api/server';
import config from 'config';
import log from 'common/log';

export default async function setupAPIServer() {
	const apiOptions = config.get('api');
	const { secret } = config.get('jwt');
	await initialize({ jwtSecret: Buffer.from(secret, 'base64'), ...apiOptions });

	log.info('listening on %o', server.wss.address());

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
