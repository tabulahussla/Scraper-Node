import config from 'config';
import os from 'os';
import { client, init } from 'discovery/client';
import log from 'common/log';
import discoverResourceBroker from 'discovery/resource-broker';

export default async function setup() {
	await setupServiceDiscovery();
	await discoverResourceBroker();
}

export async function setupServiceDiscovery() {
	const { client: clientOptions } = config.get('discovery');
	init(clientOptions);

	await client.connect();

	log.debug('CONNECTED WITH DISCOVERY SERVICE');
	// †
	const nodeId = config.get('node-id') || os.hostname();
	const { host, port, type } = config.get('api');
	const { service, payload } = config.get('discovery');
	const modifiedPayload = { host, port, type, ...payload };

	log.debug('REGISTERING %o', modifiedPayload);

	await client.register(service, nodeId, modifiedPayload);

	log.debug('REGISTERED NODE %s ON SERVICE %s WITH PAYLOAD %o', nodeId, service, modifiedPayload);
}
