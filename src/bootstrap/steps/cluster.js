import cluster from 'cluster';
import config from 'config';
import path from 'path';
import os from 'os';
import bootstrapWorker from 'bootstrap/worker';
import clone from 'clone';

export default async function setupCluster() {
	const { maxWorkers, entryPointForWorker, enabled } = config.get('cluster');

	if (!enabled) {
		await setupOnMainThread();
		return;
	}

	const amountOfCPUs = os.cpus().length;
	let amountOfWorkers;

	if (maxWorkers > 0) {
		amountOfWorkers = Math.min(maxWorkers, amountOfCPUs);
	} else {
		amountOfWorkers = amountOfCPUs + maxWorkers;
	}

	cluster.setupMaster({
		exec: path.resolve(entryPointForWorker),
	});

	for (let i = 0; i < amountOfWorkers; i++) {
		await setupWorker(i, amountOfWorkers);
	}
}

export async function setupOnMainThread() {
	bootstrapWorker({
		_workerInit: true,
		sites: clone(config.get('sites')),
	});
}

export async function setupWorker(workerNumber, amountOfWorkers) {
	const worker = cluster.fork();
	await waitForWorker(worker);

	const sites = config.get('sites').map(configuredSite => {
		const site = { ...configuredSite };

		const concurrencyPerWorker = Math.floor(configuredSite.concurrency / amountOfWorkers);
		const totalDistributedConcurrency = concurrencyPerWorker * amountOfWorkers;
		const concurrencyFix = configuredSite.concurrency - totalDistributedConcurrency;

		site.concurrency = concurrencyPerWorker;

		const isLastWorker = workerNumber + 1 === amountOfWorkers;
		if (isLastWorker) {
			site.concurrency += concurrencyFix;
		}

		return site;
	});

	const workerOptions = { _workerInit: true, sites };
	await initializeWorker(worker, workerOptions);
}

export function waitForWorker(worker) {
	return new Promise(resolve => {
		worker.once('online', () => resolve());
	});
}

export function initializeWorker(worker, options) {
	return new Promise((resolve, reject) => {
		worker.once('message', message => resolve(message));
		worker.once('error', err => reject(err));

		worker.send(options);
	});
}
