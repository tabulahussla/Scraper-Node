import cluster from 'cluster';
import config from 'config';
import path from 'path';
import os from 'os';

export default async function setupCluster() {
	const { maxWorkers, entryPointForWorker } = config.get('cluster');

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

export async function setupWorker(workerNumber, amountOfWorkers) {
	const queueConfig = config.get('queues');
	const queues = {};
	const workerOptions = { _workerInit: true, queues };
	const worker = cluster.fork();

	await waitForWorker(worker);

	for (const queue in queueConfig) {
		const queueOptions = (queues[queue] = { ...queueConfig[queue] });

		const concurrencyPerWorker = Math.round(queueOptions.concurrency / amountOfWorkers);
		const additionalConcurrency =
			queueOptions.concurrency - concurrencyPerWorker * amountOfWorkers;

		queueOptions.concurrency = concurrencyPerWorker;
		if (workerNumber + 1 === amountOfWorkers) {
			queueOptions.concurrency += additionalConcurrency;
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
