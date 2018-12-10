import config from 'config';
import log from 'common/log';

const { destroyAfterTimeout, warnIfNotReturnedTimeout } = config.get('agent');

export default class AgentPoolTimeouts {
	constructor(agentPool) {
		this._agentPool = agentPool;
		this._destroy = new Map();
		this._warn = new Map();
	}

	destroyAfterInactivity(agent) {
		this._destroy.set(
			agent.id,
			setTimeout(
				() => agent && agent.destroy && agent.destroy().catch(err => log.fatal({ err })),
				destroyAfterTimeout,
			),
		);
	}

	warnIfNotReturned(agent) {
		this._warn.set(
			agent.id,
			setTimeout(
				() =>
					log.debug(
						'agent "%s" was not returned to pool after timeout',
						agent && agent.id,
					),
				warnIfNotReturnedTimeout,
			),
		);
	}

	clearDestroy(agent) {
		const timeout = this._destroy.get(agent.id);
		timeout && clearTimeout(timeout);
	}

	clearWarning(agent) {
		const timeout = this._warn.get(agent.id);
		timeout && clearTimeout(timeout);
	}
}
