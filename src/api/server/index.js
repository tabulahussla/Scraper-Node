import services from '../services';
import { wsAPIServer } from '@xxorg/ws-api';

export let server;
export async function initialize(options) {
	server = wsAPIServer({ ...options });

	await new Promise((resolve, reject) => {
		server.once('listening', () => resolve());
		server.once('error', () => reject());
	});

	Object.keys(services).forEach(serviceName => {
		server.registerService(services[serviceName]);
	});
}
