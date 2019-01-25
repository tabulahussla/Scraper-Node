import { createCollection } from 'measured-core';
import { name as projectName } from '../project';
import { hrtimeToSec } from 'bootstrap/common/hrtime';
import log from 'common/log';

export const FAILED_JOBS = 'FAILED_JOBS';
export const SUCCEEDED_JOBS = 'SUCCEEDED_JOBS';
export const JOB_TIME = 'JOB_TIME';
export const SCHEDULED_JOBS = 'SCHEDULED_JOBS';
export const collection = createCollection(projectName);

export function jobStats(job) {
	const time = process.hrtime();

	job.once('failed', err => {
		jobEnded(time, job);
		jobFailed(job, err);
		log.trace('job %d on %s failed', job.id, job.queue.name);
		log.warn({ err });
	});
	job.once('succeeded', () => {
		jobEnded(time, job);
		jobSucceeded(job);
		log.trace('job %d on %s succeeded', job.id, job.queue.name);
	});

	jobStarted(job);
	log.trace('job %d on %s', job.id, job.queue.name);
}

// eslint-disable-next-line no-unused-vars
export function jobEnded(beginningTime, job) {
	const timeSeconds = hrtimeToSec(process.hrtime(beginningTime));
	collection.histogram(JOB_TIME).update(timeSeconds);
}

// eslint-disable-next-line no-unused-vars
export function jobFailed(job, err) {
	collection.counter(FAILED_JOBS).inc();
}

// eslint-disable-next-line no-unused-vars
export function jobSucceeded(job) {
	collection.counter(SUCCEEDED_JOBS).inc();
}

// eslint-disable-next-line no-unused-vars
export function jobStarted(job) {
	collection.counter(SCHEDULED_JOBS).inc();
}
