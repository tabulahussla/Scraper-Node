/**
 * Catch uncaught exceptions & unhandled rejections
 */

import { worker } from 'cluster';
import log from 'common/log';

const workerMessage = worker ? ` on worker ${worker.id}` : '';

process.on('rejectionHandled', () => {});
process.on('unhandledRejection', (p, reason) => {
	log.fatal('Unhandled Promise Rejection%s:', workerMessage, p);
	reason.catch(err => log.fatal({ err }));
});

process.on('uncaughtException', err => {
	log.fatal('Uncaught Exception%s:', workerMessage);
	log.fatal({ err });

	throw err;
});
