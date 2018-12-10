import { register } from 'scripts';
import queueRegistry from 'queues/registry';

export default {
	async registerScript({ site, section, mode, handler, externalDependencies }) {
		await register({ site, section, mode, handler, externalDependencies });
	},
	async getQueueConfig() {
		return queueRegistry.getAvailableQueues();
	},
};
