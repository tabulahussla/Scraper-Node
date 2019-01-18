import { initialize, listen, server } from '../api/server';
import config from 'config';
import log from 'common/log';

export default async function setupAPIServer() {
	const { type, tls, ...listenOptions } = config.get('api');
	const { secret } = config.get('jwt');
	initialize({ type, tls, secret });
	listen(listenOptions);

	server.server.once('listening', () => log.info('listening on %o', server.server.address()));
}
