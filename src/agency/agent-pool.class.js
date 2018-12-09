// eslint-disable-next-line no-unused-vars
import { ResourceBrokerClient } from 'resource-broker-client';
import Agent from './agent.class';
import config from 'config';

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
	}

	async getOrCreateAgent({ queue: queueName }) {
		const resourceList = config.get('resources-for-queue')[queueName] || [];

		let agent, index = this.findIndex(resourceList);
		if (~index) {
			agent = this._pool[index];
			this._pool.splice(index, 1);
			return agent;
		}

		const [proxyPoolId, accountPoolId] = resourceList;
		agent = await this.createAgent({ proxyPoolId, accountPoolId });

		return agent;
	}

	returnAgent(agent) {
		this._pool.push(agent);
	}

	findIndex(resourceList) {
		return this._pool.findIndex(agent =>
			agent.resources.every(resource => resourceList.includes(resource)),
		);
	}

	async createAgent({ proxyPoolId, accountPoolId }) {
		const proxy = proxyPoolId && (await this._resourceBrokerClient.getResource(proxyPoolId));
		const account =
			accountPoolId && (await this._resourceBrokerClient.getResource(accountPoolId));

		const agent = new Agent({
			// @ts-ignore
			proxy,
			// @ts-ignore
			account,
			puppeteerOptions: { ...config.get('puppeteer') },
			resources: [proxy && proxyPoolId, account && accountPoolId].filter(v => v),
		});

		await agent.init();
		await agent.restoreSession();

		return agent;
	}
}
