import config from 'config';
import os from 'os';
import { client } from 'discovery/client';
import log from 'common/log';
import { getServiceHost } from './api';

export default async function setup() {
	await setupServiceDiscovery();
}

export async function setupServiceDiscovery() {
	// †
	const nodeId = config.get('node-id') || os.hostname();
	const { host, port } = config.get('api');
	const { service, payload } = config.get('discovery');
	const serviceHost = getServiceHost();
	const address = `ws://${serviceHost || host}:${port}/`;
	const modifiedPayload = { address, ...payload };

	log.debug('REGISTERING %o', modifiedPayload);

	await client.register(service, nodeId, modifiedPayload);

	log.debug('REGISTERED NODE %s ON SERVICE %s WITH PAYLOAD %o', nodeId, service, modifiedPayload);
}
