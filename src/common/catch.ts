/**
 * Catch uncaught exceptions & unhandled rejections
 */

import { worker } from "cluster";
import log from "~/common/log";

const workerMessage = worker ? ` on worker ${worker.id}` : "";

// tslint:disable-next-line: no-empty
process.on("rejectionHandled", () => {});
process.on("unhandledRejection", (p, reason) => {
	log.fatal("Unhandled Promise Rejection%s:", workerMessage, p, reason);
	// eslint-disable-next-line no-process-exit
	reason.catch(err => log.fatal({ err })).then(() => process.exit(1));
});

process.on("uncaughtException", err => {
	log.fatal("Uncaught Exception%s:", workerMessage);
	log.fatal({ err });

	throw err;
});
