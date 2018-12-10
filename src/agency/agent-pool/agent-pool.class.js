// eslint-disable-next-line no-unused-vars
import { ResourceBrokerClient } from 'resource-broker-client';
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

		agent.once('destroy', async () => {
			try {
				for (const resource of agent.resources) {
					try {
						await this._resourceBrokerClient.returnResource(resource, resource.poolId);
					} catch (err) {
						log.fatal({ err });
					}
				}
			} catch (err) {
				log.fatal({ err });
			}
		});

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
		const proxy = proxyPoolId && (await this._resourceBrokerClient.getResource(proxyPoolId));
		const account =
			accountPoolId && (await this._resourceBrokerClient.getResource(accountPoolId));

		if (proxy) {
			// @ts-ignore
			proxy.poolId = proxyPoolId;
		}
		if (account) {
			// @ts-ignore
			account.poolId = accountPoolId;
		}

		const agent = new Agent({
			// @ts-ignore
			proxy,
			// @ts-ignore
			account,
			puppeteerOptions: { ...config.get('puppeteer') },
			resources: [proxy, account].filter(v => v),
		});

		await agent.init();

		return agent;
	}
}
