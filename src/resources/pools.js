import config from 'config';

const resourceBrokerConfig = { ...config.get('resource-broker') };
const { pools = {} } = resourceBrokerConfig;

const resourcesInPool = new Map();

for (const resourceType in resourceBrokerConfig.pools) {
	if (Array.isArray(pools[resourceType])) {
		for (const poolId of pools[resourceType]) {
			const resourcesForCurrentPool = resourcesInPool.get(poolId) || new Set();
			resourcesForCurrentPool.add(resourceType);

			resourcesInPool.set(poolId, resourcesForCurrentPool);
		}
	}
}

export function findPool(resourceType, allowedPools) {
	for (const poolId of resourcesInPool.keys()) {
		if (!allowedPools.includes(poolId)) {
			continue;
		}

		if (resourcesInPool.get(poolId).has(resourceType)) {
			return poolId;
		}
	}
}
