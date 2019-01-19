import { getClients } from 'discovery/resource-broker';

export default function getResourceBroker() {
	return getClients()[0];
}
