import config from 'config';
import { client, init } from 'discovery/client';
import log from 'common/log';

export default async function setupServiceDiscovery() {
	const { client: clientOptions } = config.get('discovery');
	init(clientOptions);

	await client.connect();

	log.debug('CONNECTED WITH DISCOVERY SERVICE');
	// †
	const nodeId = config.get('node-id');
	const { host, port, type } = config.get('api');
	const { service, payload } = config.get('discovery');
	const modifiedPayload = { host, port, type, ...payload };

	await client.register(service, nodeId, modifiedPayload);

	log.debug('REGISTERED NODE %s ON SERVICE %s WITH PAYLOAD %o', nodeId, service, modifiedPayload);
}
