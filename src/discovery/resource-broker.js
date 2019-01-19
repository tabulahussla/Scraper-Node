import createClient from 'resource-broker-client';
import { client as discoveryClient } from './client';
import log from 'common/log';
import config from 'config';

export const ResourceBrokerService = 'resource-broker';

export const CLIENT_MAP = new Map();

const resourceBrokerConfig = config.get('resource-broker');

export function getClients() {
	return Array.from(CLIENT_MAP.values());
}

export async function connectClient({ nodeId, ...payload }) {
	log.debug('CONNECT RESOURCE BROKER', nodeId);
	const resourceBroker = createClient({ ...payload, ...resourceBrokerConfig });
	await resourceBroker.connect();
	CLIENT_MAP.set(nodeId, resourceBroker);
}

export async function disconnectClient(nodeId) {
	log.debug('DISCCONNECT RESOURCE BROKER', nodeId);
	const client = CLIENT_MAP.get(nodeId);
	if (client) {
		CLIENT_MAP.delete(nodeId);
		await client.close();
	}
}

export default async function discoverResourceBroker() {
	discoveryClient.on('register', ({ service, nodeId, payload }) => {
		if (service !== ResourceBrokerService) {
			return;
		}

		connectClient({ nodeId, ...payload });
	});
	discoveryClient.on('evict', ({ service, nodeId }) => {
		if (service !== ResourceBrokerService) {
			return;
		}
		disconnectClient(nodeId);
	});

	const activeNodes = await discoveryClient.getActiveNodes(ResourceBrokerService);

	log.debug('ACTIVE NODES ON %s SERVICE:', ResourceBrokerService, activeNodes);
	for (const node of activeNodes) {
		await connectClient(node);
	}
}
