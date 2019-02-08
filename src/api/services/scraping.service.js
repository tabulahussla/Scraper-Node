import registry from 'queues/registry';
import waitForJob from 'common/wait-for-job';
import { plugins } from 'plugins';
import log from 'common/log';
import { jobStats } from 'stats';

export default {
	async createJob({
		queue: queueName,
		contract,
		jobOptions: {
			retries = 10,
			delayUntil = 0,
			timeout = 0,
			jobId = void 0,
			backoffStrategy = 'exponential',
			backoffDelayFactor = 1000,
		} = {},
	}) {
		log.trace('⛏ %s/%s on %s', contract.site, contract.section, queueName);

		try {
			const queue = registry.getQueue(queueName);
			if (!queue) {
				throw new Error(`no such queue "${queueName}"`);
			}

			const job = queue.createJob(contract);

			if (retries > 0) {
				job.retries(retries);
			}

			if (delayUntil > 0) {
				job.delayUntil(delayUntil);
			}

			if (timeout > 0) {
				job.timeout(timeout);
			}

			if (jobId) {
				job.setId(jobId);
			}

			if (backoffStrategy) {
				// @ts-ignore
				job.backoff(backoffStrategy, backoffDelayFactor);
			}

			const resultPromise = waitForJob(job);

			await job.save();
			jobStats(job);

			return await resultPromise;
		} catch (err) {
			log.error({ err });
			throw err;
		}
	},
	getQueueConfig({ name = void 0 } = {}) {
		return registry.getQueueConfig(name);
	},
	getPlugins() {
		return Array.from(plugins).map(p => p.name);
	},
};
