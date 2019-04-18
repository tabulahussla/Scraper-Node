// eslint-disable-next-line no-unused-vars
import createClient, { ResourceBrokerClient } from '@xxorg/resource-broker-client';

/** @type {ResourceBrokerClient} */
export let resourceBroker;

export async function connectResourceBroker(options) {
	resourceBroker = createClient({ ...options });
	await resourceBroker.connect();
}
