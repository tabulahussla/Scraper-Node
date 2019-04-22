import { createCollection } from "measured-core";
import { hrtimeToSec } from "~/bootstrap/common/hrtime";
import { name as projectName } from "../project";

export const FAILED_JOBS = "FAILED_JOBS";
export const SUCCEEDED_JOBS = "SUCCEEDED_JOBS";
export const JOB_TIME = "JOB_TIME";
export const SCHEDULED_JOBS = "SCHEDULED_JOBS";
export const collection = createCollection(projectName);

// eslint-disable-next-line no-unused-vars
export function jobFailed(contract, err) {
	collection.counter(FAILED_JOBS).inc();
}

// eslint-disable-next-line no-unused-vars
export function jobSucceeded(beginningTime, contract) {
	collection.counter(SUCCEEDED_JOBS).inc();
	const timeSeconds = hrtimeToSec(process.hrtime(beginningTime));
	collection
		.histogram(`${JOB_TIME}:${contract.site}/${contract.section}`)
		.update(timeSeconds);
}

// eslint-disable-next-line no-unused-vars
export function jobStarted(contract) {
	collection.counter(SCHEDULED_JOBS).inc();
}
