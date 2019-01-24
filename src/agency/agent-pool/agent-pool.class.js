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

		let agent,
			index = this.findIndex(resources, pools);
		if (~index) {
			agent = this._pool[index];
			this._timeouts.clearDestroy(agent);
			this._pool.splice(index, 1);
			this._timeouts.warnIfNotReturned(agent);
			return agent;
		}

		let proxyPoolId, accountPoolId;
		if (resources.includes('proxy')) {
			proxyPoolId = findPool('proxy', pools);
		}

		if (resources.includes('account')) {
			accountPoolId = findPool('account', pools);
		}

		agent = await this.createAgent({ proxyPoolId, accountPoolId });

		this._timeouts.warnIfNotReturned(agent);
		return agent;
	}

	returnAgent(agent) {
		this._pool.push(agent);
		this._timeouts.clearWarning(agent);
		this._timeouts.destroyAfterInactivity(agent);
	}

	findIndex(resources, pools) {
		return this._pool.findIndex(agent => {
			return resources.every(resourceType =>
				agent.resources.find(agentResource => {
					return (
						agentResource.type === resourceType && pools.includes(agentResource.poolId)
					);
				}),
			);
		});
	}

	async createAgent({ proxyPoolId, accountPoolId }) {
		const proxy = proxyPoolId && (await this._resourceBrokerClient().retrieve(proxyPoolId));
		const account =
			accountPoolId && (await this._resourceBrokerClient().retrieve(accountPoolId));

		if (proxy) {
			// @ts-ignore
			proxy.poolId = proxyPoolId;
		} else if (proxyPoolId) {
			throw new Error('Could not resolve proxy resource');
		}
		if (account) {
			// @ts-ignore
			account.poolId = accountPoolId;
		} else if (accountPoolId) {
			throw new Error('Could not resolve account resource');
		}

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
}
