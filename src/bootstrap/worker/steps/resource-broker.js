import config from 'config';
import { connectResourceBroker } from 'resources/broker';

export default async function connectResourceBrokerAsConfigured() {
	const resourceBrokerConfiguration = config.get('resource-broker');
	await connectResourceBroker(resourceBrokerConfiguration);
}
