import config from 'config';
import log from 'common/log';

const resourceBrokerConfig = { ...config.get('resource-broker') };
const { pools = {} } = resourceBrokerConfig;

const resourcesInPool = new Map();

/*
"pools": {
	"RESOURCE_TYPE": ["POOL_ID_1", "POOL_ID_2"],
},
*/
for (const resourceType in resourceBrokerConfig.pools) {
	for (const poolId of pools[resourceType]) {
		const resourcesForCurrentPool = resourcesInPool.get(poolId) || new Set();
		resourcesForCurrentPool.add(resourceType);
		log.debug('ADD RES %s TO POOL %s', resourceType, poolId);

		resourcesInPool.set(poolId, resourcesForCurrentPool);
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
