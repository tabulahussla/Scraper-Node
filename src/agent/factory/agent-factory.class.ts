import config from "config";
import log from "~/common/log";
import { resourceBroker } from "~/resources/broker";
import Agent from "../agent.class";
import AgentTimeouts from "./agent-timeouts.class";

export default class AgentFactory {
	public timeouts: AgentTimeouts;

	/**
	 * Creates an instance of AgentPool.
	 *
	 * @memberof AgentPool
	 */
	constructor() {
		this.timeouts = new AgentTimeouts(this);
	}

	public async createAgent({ proxy, account }) {
		const agent = new Agent({
			// @ts-ignore
			proxy,
			// @ts-ignore
			account,
			puppeteerOptions: { ...config.get("puppeteer") },
			resources: [proxy, account].filter(v => v),
		});

		agent.once("destroy", async () => {
			log.debug("AGENT DESTROYED!", agent.id);

			// release resources
			for (const resource of agent.resources) {
				try {
					await resourceBroker.release(resource, resource.poolId);
				} catch (err) {
					log.fatal("failed to release resource %o", resource);
					log.fatal({ err });
				}
			}

			// clear timeouts
			this.timeouts.clearWarning(agent);
			this.timeouts.destroyAfterInactivity(agent);
		});

		try {
			await agent.init();
		} catch (error1) {
			log.fatal("failed to initialize agent");
			log.fatal({ err: error1 });
			try {
				await agent.destroy();
			} catch (error2) {
				log.fatal("failed to destroy agent after failed init");
				log.fatal({ err: error2 });
			}

			throw error1;
		}

		this.timeouts.warnIfNotReturned(agent);

		return agent;
	}
}
