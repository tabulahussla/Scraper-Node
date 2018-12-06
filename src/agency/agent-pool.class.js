// eslint-disable-next-line no-unused-vars
import { ResourceBrokerClient } from 'resource-broker-client';
import Agent from './agent.class';

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
	}

	async getOrCreateAgent({ proxyPoolId, accountPoolId }) {
		
	}

	async createAgent({ proxyPoolId, accountPoolId }) {
		const proxy = await this._resourceBrokerClient.getResource(proxyPoolId);
		const account = await this._resourceBrokerClient.getResource(accountPoolId);

		// @ts-ignore
		const agent = new Agent({ proxy, account });

		await agent.init();
		await agent.restoreSession();

		return agent;
	}
}
