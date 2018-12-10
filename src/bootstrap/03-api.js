import config from 'config';
import path from 'path';
import apiServer from 'api/server';
import { readFileSync } from 'fs';
import log from 'common/log';

export function readCertificates({ pfx, key, ca, cert }) {
	return {
		pfx: pfx && readFileSync(path.resolve(pfx)),
		key: key && readFileSync(path.resolve(key)),
		cert: cert && readFileSync(path.resolve(cert)),
		ca: ca && [readFileSync(path.resolve(ca))],
	};
}

export default async function setupJsonRPCServer() {
	const { host, port, tlsOptions } = config.get('service');
	const tlsServer = apiServer.tls({ ...tlsOptions, ...readCertificates(tlsOptions) });

	await new Promise((resolve, reject) => {
		tlsServer.once('listening', () => resolve(tlsServer));
		tlsServer.once('error', err => reject(err));

		tlsServer.listen(port, host);
	});

	log.debug('LISTENING ON %s:%d', host, port);
}
