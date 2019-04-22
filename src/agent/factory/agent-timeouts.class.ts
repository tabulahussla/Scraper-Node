import config from "config";
import log from "~/common/log";

const { destroyAfterTimeout, warnIfNotReturnedTimeout } = config.get("agent");

export default class AgentTimeouts {
	public destroyMap: Map<any, any>;
	public warnMap: Map<any, any>;

	constructor() {
		this.destroyMap = new Map();
		this.warnMap = new Map();
	}

	public destroyAfterInactivity(agent) {
		this.destroyMap.set(
			agent.id,
			setTimeout(
				() =>
					agent &&
					agent.destroy &&
					agent.destroy().catch(err => log.fatal({ err })),
				destroyAfterTimeout
			)
		);
	}

	public warnIfNotReturned(agent) {
		this.warnMap.set(
			agent.id,
			setTimeout(
				() =>
					log.debug(
						"agent \"%s\" was not returned to pool after timeout",
						agent && agent.id
					),
				warnIfNotReturnedTimeout
			)
		);
	}

	public clearDestroy(agent) {
		const timeout = this.destroyMap.get(agent.id);
		if (timeout) {
			clearTimeout(timeout);
		}
	}

	public clearWarning(agent) {
		const timeout = this.warnMap.get(agent.id);
		if (timeout) {
			clearTimeout(timeout);
		}
	}
}
