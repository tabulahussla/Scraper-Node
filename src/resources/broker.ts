import createClient, {
	ResourceBrokerClient,
} from "@xxorg/resource-broker-client";

export let resourceBroker: ResourceBrokerClient;

export async function connectResourceBroker(options) {
	resourceBroker = createClient({ ...options });
	await resourceBroker.connect();
}
