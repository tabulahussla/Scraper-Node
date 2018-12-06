export default class Agent {
	/**
	 * Creates an instance of Agent.
	 *
	 * @param {Object} options
	 * @param {Proxy} options.proxy
	 * @param {Account} options.account
	 * @memberof Agent
	 */
	constructor({ proxy, account }) {
		this._proxy = proxy;
		this._account = account;
	}

	async init() {}

	async restoreSession() {}
}
