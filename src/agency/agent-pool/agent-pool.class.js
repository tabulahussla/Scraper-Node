// eslint-disable-next-line no-unused-vars
import { ResourceBrokerClient } from '@xxorg/resource-broker-client';
import Agent from '../agent.class';
import config from 'config';
import { findPool } from 'resources/pools';
import AgentPoolTimeouts from './agent-pool-timeouts.class';
import log from 'common/log';

const queueConfig = config.get('queues');
// TODO: Synchronise agents on cluster

export default class AgentPool {
	/**
	 * Creates an instance of AgentPool.
	 *
	 * @param {Object} options
	 * @param {ResourceBrokerClient} options.resourceBrokerClient
	 * @memberof AgentPool
	 */
	constructor({ resourceBrokerClient }) {
		this._resourceBrokerClient = resourceBrokerClient;
		/** @type {Agent[]} */
		this._pool = [];
		this._timeouts = new AgentPoolTimeouts(this);
	}

	getAgent({ queue: queueName }) {
		const { resources = [], pools = [] } = queueConfig[queueName] || {};

		let agent,
			index = this.findIndex(resources, pools);
		if (~index) {
			agent = this._pool[index];
			this._pool.splice(index, 1);
			return agent;
		}
	}

	async getOrCreateAgent({ queue: queueName }) {
		const { resources = [], pools = [] } = queueConfig[queueName] || {};

		log.debug('GET OR CREATE AGENT << %d >>', this._pool.length);
		let agent,
			index = this.findIndex(resources, pools);
		if (~index) {
			log.debug('FOUND AGENT WITH ALL RESOURCES!');
			agent = this._pool[index];
			this._timeouts.clearDestroy(agent);
			this._pool.splice(index, 1);
			this._timeouts.warnIfNotReturned(agent);
			return agent;
		}

		log.debug('CREATING NEW AGENT << %d >>', this._pool.length);
		const { proxy, account } = await this._resolveResources({
			resources,
			pools,
			queue: queueName,
		});

		agent = await this.createAgent({ proxy, account });

		this._timeouts.warnIfNotReturned(agent);
		return agent;
	}

	returnAgent(agent) {
		this._pool.push(agent);
		this._timeouts.clearWarning(agent);
		this._timeouts.destroyAfterInactivity(agent);
		log.debug('RETURN AGENT TO POOL << %d >>', this._pool.length);
	}

	findIndex(resources, pools) {
		log.debug('FIND INDEX: %s in %s', resources, pools);
		return this._pool.findIndex(agent => {
			log.debug('AGENT %s has %o', agent.id, agent.resources);
			return resources.every(resourceType =>
				agent.resources.find(agentResource => {
					return (
						agentResource.type === resourceType && pools.includes(agentResource.poolId)
					);
				}),
			);
		});
	}

	async createAgent({ proxy, account }) {
		const agent = new Agent({
			// @ts-ignore
			proxy,
			// @ts-ignore
			account,
			puppeteerOptions: { ...config.get('puppeteer') },
			resources: [proxy, account].filter(v => v),
		});

		agent.once('destroy', async () => {
			log.debug('AGENT DESTROYED!', agent.id);

			try {
				for (const resource of agent.resources) {
					try {
						await this._resourceBrokerClient().release(resource, resource.poolId);
					} catch (err) {
						log.fatal('failed to release resource %o', resource);
						log.fatal({ err });
					}
				}
				this._timeouts.clearWarning(agent);
				this._timeouts.destroyAfterInactivity(agent);
			} catch (err) {
				log.fatal('failed to release resources');
				log.fatal({ err });
			}
		});

		try {
			await agent.init();
		} catch (error1) {
			log.fatal('failed to initialize agent');
			log.fatal({ err: error1 });
			try {
				await agent.destroy();
			} catch (error2) {
				log.fatal('failed to destroy agent after unsuccessful init');
				log.fatal({ err: error2 });
			}

			throw error1;
		}

		return agent;
	}

	async _resolveResources({ resources, pools, queue, getAllOrThrow = true }) {
		const resolved = {};
		for (const type of resources) {
			const poolId = findPool(type, pools);
			if (!poolId) {
				throw new Error(
					`Cannot resolve pool for resource type ${type} ` +
						`on queue ${queue} (available pools: ${pools})`,
				);
			}
			const resource = await this._resourceBrokerClient().retrieve(poolId);
			if (resource) {
				resolved[type] = resource;
			} else if (getAllOrThrow) {
				throw new Error(`Cannot resolve resource of type ${type}`);
			}
		}
		return resolved;
	}
}
