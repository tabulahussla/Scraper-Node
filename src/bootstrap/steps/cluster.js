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
		queues: clone(config.get('queues')),
	});
}

export async function setupWorker(workerNumber, amountOfWorkers) {
	const queueConfig = config.get('queues');
	const queues = {};
	const workerOptions = { _workerInit: true, queues };
	const worker = cluster.fork();

	await waitForWorker(worker);

	for (const queue in queueConfig) {
		const queueOptions = (queues[queue] = { ...queueConfig[queue] });

		const concurrencyPerWorker = Math.floor(queueOptions.concurrency / amountOfWorkers);
		const additionalConcurrency =
			queueOptions.concurrency - concurrencyPerWorker * amountOfWorkers;

		queueOptions.concurrency = concurrencyPerWorker;
		if (workerNumber + 1 === amountOfWorkers) {
			queueOptions.concurrency += additionalConcurrency;
		}

		if (queueOptions.concurrency <= 0) {
			delete queues[queue];
		}
	}

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
