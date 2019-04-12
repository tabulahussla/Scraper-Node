import config from 'config';
import { client, init } from 'discovery/client';
import log from 'common/log';
import discoverResourceBroker from 'discovery/resource-broker';

export default async function setup() {
	await setupServiceDiscovery();
	discoverResourceBroker();
}

export async function setupServiceDiscovery() {
	const clientOptions = config.get('discovery');
	init(clientOptions);

	await client.connect();

	log.debug('CONNECTED WITH DISCOVERY SERVICE');
}
