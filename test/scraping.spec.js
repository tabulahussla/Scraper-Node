import 'mocha';
import assert from 'assert';
import Queue from 'bee-queue';
import { register, RegisterMode } from 'scripts';
// eslint-disable-next-line no-unused-vars
import Agent from 'agency/agent.class';
// eslint-disable-next-line no-unused-vars
import http from 'http';
import resourceBrokerClient from 'resources/broker';
import bootstrapPipeline from 'bootstrap';
import { ObjectId } from 'bson';

const testId = '5c0dac05b4da54983769b022';

// @ts-ignore
async function testAuthorizeAgent({ agent, log }) {
	log.debug('run testAuthorizeAgent');
	agent.isAuthorized = true;
}

async function testGlobalPreHandler({ payload, log }) {
	log.debug('run testGlobalPreHandler');
	payload._testGlobalPreHandler = true;
}

async function testGlobalPostHandler({ payload, result, require, log }) {
	log.debug('run testGlobalPostHandler');
	require('assert').ok(result && result.parameter);
	payload._testGlobalPostHandler = true;
}

/**
 * @param {Object} options
 * @param {Agent} options.agent
 * @param {any} options.payload
 * @param {any} [options.log]
 * @param {any} [options.require]
 */
async function testAgentScraping({ agent, payload, require }) {
	// @ts-ignore
	require('assert').ok(agent.isAuthorized);
	require('assert').ok(payload._testGlobalPreHandler);
	// @ts-ignore
	agent.isAuthorized = false;

	await agent.page.goto('https://example.com');

	const title = await agent.page.title();

	await agent.destroy();

	return {
		title,
		parameter: payload.parameter,
	};
}

/**
 * @param {Object} options
 * @param {http.Agent} options.proxyAgent
 * @param {any} options.payload
 * @param {any} [options.log]
 * @param {any} options.require
 */
async function testHttpScraping({ proxyAgent, payload, require }) {
	require('assert').ok(proxyAgent);
	require('assert').ok(payload._testGlobalPreHandler);

	const body = await require('request-promise-native')({
		url: 'https://example.com',
	});

	return {
		body,
		parameter: payload.parameter,
	};
}

const agentQueue = new Queue('test-agent');
const httpQueue = new Queue('test-http');

describe('Scraping', () => {
	before(async () => {
		await bootstrapPipeline();

		register({
			site: 'test.com',
			handler: testGlobalPreHandler,
			mode: RegisterMode.pre,
		});
		register({
			site: 'test.com',
			handler: testGlobalPostHandler,
			mode: RegisterMode.post,
		});
		register({
			site: 'test.com',
			section: 'front-page',
			handler: testAuthorizeAgent,
			mode: RegisterMode.pre,
		});
		register({
			site: 'test.com',
			section: 'front-page',
			handler: testAgentScraping,
			mode: RegisterMode.default,
		});
		register({
			site: 'test.com',
			section: 'http-page',
			handler: testHttpScraping,
			externalDependencies: ['assert'],
			mode: RegisterMode.default,
		});

		await resourceBrokerClient.returnResource(
			{
				type: 'proxy',
				// @ts-ignore
				host: '127.0.0.1',
				port: 1234,
				protocol: 'http',
				_id: new ObjectId(testId),
			},
			'test proxies',
		);
		await resourceBrokerClient.returnResource(
			{
				type: 'account',
				// @ts-ignore
				email: 'le',
				password: 'test',
				_id: new ObjectId(testId),
			},
			'test accounts',
		);
	});

	it('should be able to process agent scraping job', function(cb) {
		this.timeout(10000);

		const payload = {
			site: 'test.com',
			section: 'front-page',
			parameter: 'value',
		};

		const job = agentQueue.createJob(payload);

		job.on('succeeded', result => {
			try {
				// @ts-ignore
				assert.ok(result.title);
				// @ts-ignore
				assert.strictEqual(payload.parameter, result.parameter);

				cb();
			} catch (e) {
				cb(e);
			}
		});
		job.on('failed', err => {
			cb(err);
		});

		job.save().catch(cb);
	});

	it('should be able to process http scraping job', function(cb) {
		this.timeout(10000);

		const payload = {
			site: 'test.com',
			section: 'http-page',
			parameter: 'value',
		};

		const job = httpQueue.createJob(payload);

		// @ts-ignore
		job.on('succeeded', result => {
			try {
				// @ts-ignore
				assert.ok(result.body);
				// @ts-ignore
				assert.strictEqual(payload.parameter, result.parameter);

				cb();
			} catch (e) {
				cb(e);
			}
		});
		job.on('failed', err => {
			cb(err);
		});

		job.save().catch(cb);
	});
});
