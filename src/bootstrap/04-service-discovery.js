import config from 'config';
import { ServiceDiscovery } from 'service-discovery';
import redisClient from 'database/redis/ioredis';

/** @type {ServiceDiscovery} */
export let client;

export default async function setupServiceDiscovery() {
	const { host, port } = config.get('service');
	const discoveryConfig = config.get('service-discovery');
	const redis = discoveryConfig.redis || redisClient;
	client = new ServiceDiscovery({ host, port, ...discoveryConfig, redis });
}
