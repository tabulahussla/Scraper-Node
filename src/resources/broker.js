import { getClients } from 'discovery/resource-broker';

export default function getResourceBroker() {
	const clients = getClients();
	if (!clients.length) {
		throw new Error('No resource broker service available');
	}
	return clients[0];
}
