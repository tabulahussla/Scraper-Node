import callbackify from '../common/callbackify-service';
import registry from 'queues/registry';
import waitForJob from 'common/wait-for-job';
import { plugins } from 'plugins';

export default callbackify({
	async createJob(
		connection,
		{
			queue: queueName,
			payload,
			retries = 10,
			delayUntil,
			timeout,
			jobId,
			backoffStrategy,
			backoffDelayFactor,
			waitForJob: doWaitForJob = false,
		},
	) {
		const queue = registry.getQueue(queueName);
		if (queue) {
			throw new Error(`no such queue "${queueName}"`);
		}

		const job = queue.createJob(payload);

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
			job.backoff(backoffStrategy, backoffDelayFactor);
		}

		await job.save();

		if (!doWaitForJob) {
			return { jobId: job.id, queue: queue.name };
		}

		const result = await waitForJob(job);

		return result;
	},
	getQueueConfig(connection, name = void 0) {
		return registry.getQueueConfig(name);
	},
	getPlugins() {
		return Array.from(plugins).map(p => p.name);
	},
});
