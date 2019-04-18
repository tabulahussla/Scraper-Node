// eslint-disable-next-line no-unused-vars
import { ResourceBrokerClient } from '@xxorg/resource-broker-client';
import Agent from '../agent.class';
import config from 'config';
import AgentTimeouts from './agent-timeouts.class';
import log from 'common/log';

export default class AgentFactory {
	/**
	 * Creates an instance of AgentPool.
	 *
	 * @param {Object} options
	 * @param {ResourceBrokerClient} options.resourceBrokerClient
	 * @memberof AgentPool
	 */
	constructor({ resourceBrokerClient }) {
		this._resourceBrokerClient = resourceBrokerClient;
		this._timeouts = new AgentTimeouts(this);
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

			// release resources
			for (const resource of agent.resources) {
				try {
					await this._resourceBroker.release(resource, resource.poolId);
				} catch (err) {
					log.fatal('failed to release resource %o', resource);
					log.fatal({ err });
				}
			}

			// clear timeouts
			this._timeouts.clearWarning(agent);
			this._timeouts.destroyAfterInactivity(agent);
		});

		try {
			await agent.init();
		} catch (error1) {
			log.fatal('failed to initialize agent');
			log.fatal({ err: error1 });
			try {
				await agent.destroy();
			} catch (error2) {
				log.fatal('failed to destroy agent after failed init');
				log.fatal({ err: error2 });
			}

			throw error1;
		}

		this._timeouts.warnIfNotReturned(agent);

		return agent;
	}
}
