import 'common/catch';
import cluster from 'cluster';
import bootstrapWorker from './bootstrap/worker';
import log from 'common/log';

export let inactivityTimeout = setTimeout(() => {
	throw new Error('worker is not initialized after 5s');
}, 5000);

export { bootstrapWorker };

process.once('message', message => {
	clearTimeout(inactivityTimeout);

	/** @type {WorkerInitOptions} */
	const options = message;

	if (options._workerInit !== true) {
		throw new Error('worker received invalid message');
	}

	bootstrapWorker(options)
		.then(() => {
			process.send('ok');
			log.debug('worker #%d initialized', cluster.worker.id);
		})
		.catch(err => {
			throw err;
		});
});
