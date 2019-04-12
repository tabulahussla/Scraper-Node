import log from 'common/log';
import { deepStrictEqual } from 'assert';

function encodeBinaryJson(object) {
	const json = JSON.stringify(object);
	const buffer = Buffer.from(json);

	return buffer;
}

function parseBinaryJson(buffer) {
	const object = JSON.parse(buffer);

	return object;
}

function benchmarkJSON() {
	const sampleObject = getSampleObject(128);
	const sampleBuffer = encodeBinaryJson(sampleObject);

	deepStrictEqual(parseBinaryJson(sampleBuffer), sampleObject);

	log.debug('benchmarking JSON encode (%d bytes)', sampleBuffer.length);

	const timeSamples = [];
	for (let i = 0; i < 1000000; i++) {
		const startTime = process.hrtime();
		encodeBinaryJson(sampleObject);
		const duration = process.hrtime(startTime);
		timeSamples.push(duration);
	}

	let avgDuration = avgTimeSample(timeSamples);
	log.debug('JSON encode avg: %d ns', avgDuration);

	log.debug('benchmarking JSON decode (%d bytes)', sampleBuffer.length);

	timeSamples.length = 0;
	for (let i = 0; i < 1000000; i++) {
		const startTime = process.hrtime();
		parseBinaryJson(sampleBuffer);
		const duration = process.hrtime(startTime);
		timeSamples.push(duration);
	}

	avgDuration = avgTimeSample(timeSamples);
	log.debug('JSON decode avg: %d ns', avgDuration);
}

benchmarkJSON();

function avgTimeSample(timeSamples) {
	const NS_PER_SEC = 1e9;
	const totalNanoSeconds = timeSamples.reduce((a, [s, ns]) => a + ns + s * NS_PER_SEC, 0);
	const avg = totalNanoSeconds / timeSamples.length;
	return avg;
}

function getSampleObject(numKeys) {
	const object = {};
	for (let i = 0; i < numKeys; i++) {
		object[Math.random().toString(36)] = Math.random().toString(36);
	}
	return object;
}
