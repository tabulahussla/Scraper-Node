import puppeteer from 'puppeteer';
import path from 'path';
import config from 'config';
import log from 'common/log';

const { defaultLanguages, defaultNavigationTimeout } = config.get('agent');

export default class Agent {
	/**
	 * Creates an instance of Agent.
	 *
	 * @param {Object} options
	 * @param {Proxy} options.proxy
	 * @param {Account} options.account
	 * @param {puppeteer.LaunchOptions} options.puppeteerOptions
	 * @memberof Agent
	 */
	constructor({ proxy, account, puppeteerOptions }) {
		this._proxy = proxy;
		this._account = account;

		this._puppeteerOptions = {
			...puppeteerOptions,
			args: puppeteerOptions.args || [],
		};
		this._languages = defaultLanguages;
		this._extraHTTPHeaders = {};
		this._evaluateOnNewDocument = [];
	}

	async init() {
		// setup options for proxy
		if (this._proxy) {
			this._setupProxy();
			this._setupProxyAuth();
		}

		// setup options for account
		if (this._account) {
			this._setupAccount();
		}

		// setup localisation options
		if (Array.isArray(this._languages) && this._languages.length > 0) {
			this._setupLocalisation();
		}

		// initialize web page
		await this._createPage();

		// apply page options
		await this._setupPage();
	}

	/**
	 * Click on random point inside element bounding box
	 *
	 * @param {string} selector
	 * @param {puppeteer.ClickOptions} options click options
	 * @memberof Agent
	 */
	async click(selector, options) {
		const mouse = this.page.mouse;

		const elementHandle = await this.page.$(selector);

		// @ts-ignore
		let { x, y } = await elementHandle._clickablePoint();
		const { width, height } = await elementHandle.boundingBox();

		x += (Math.random() - 0.5) * width;
		y += (Math.random() - 0.5) * height;

		await mouse.click(x, y, options || {});
	}

	async destroy() {
		if (this.browser) {
			await this.browser.close();
			this.page = this.browser = void 0;
		}
	}

	_setupProxy() {
		this._puppeteerOptions.args.push(
			`--proxy-server=${this._proxy.protocol}://${this._proxy.host}:${this._proxy.port}`,
		);
	}

	_setupProxyAuth() {
		const { username, password } = this._proxy;

		if (username && password) {
			this._puppeteerOptions.ignoreHTTPSErrors = true;
			this._authentication = {
				username: this._proxy.username,
				password: this._proxy.password,
			};
		}
	}

	_setupAccount() {
		this._languages = this._account.languages || this._languages;
		this._puppeteerOptions.userDataDir = path.resolve(
			config.get('profileDir'),
			this._account._id,
		);
		this._viewport = this._account.viewport;
		this._userAgent = this._account.userAgent;
	}

	_setupLocalisation() {
		this._extraHTTPHeaders['Accept-Language'] = this._languages.join(', ');

		this._evaluateOnNewDocument.push([
			languages => {
				/* eslint-env browser */
				Object.defineProperty(navigator, 'language', {
					get: function() {
						return [languages[0]];
					},
				});
				Object.defineProperty(navigator, 'languages', {
					get: function() {
						return languages;
					},
				});
			},
			this._languages,
		]);

		this._puppeteerOptions.args.push(`--lang=${this._languages.join(',')}`);
	}

	async _createPage() {
		this.browser = await puppeteer.launch(this._puppeteerOptions);
		this.page = await this.browser.newPage();
	}

	async _setupPage() {
		// setup authentication (for proxy)
		if (this._authentication) {
			await this.page.authenticate(this._authentication);
		}

		// set any extra http headers
		if (this._extraHTTPHeaders && Object.keys(this._extraHTTPHeaders).length > 0) {
			await this.page.setExtraHTTPHeaders(this._extraHTTPHeaders);
		}

		// set user agent
		if (this._userAgent) {
			await this.page.setUserAgent(this._userAgent);
		}

		// apply viewport options
		if (this._viewport) {
			let { width, height } = this._viewport;
			await this.page.setViewport({
				width: +width,
				height: +height,
			});
		}

		// set default navigation timeout
		this.page.setDefaultNavigationTimeout(defaultNavigationTimeout);

		// add page event handlers
		this._acceptAllDialogs();
		this._catchPageErrors();

		// add functions that will be evaluated on every new document
		for (const [fn, ...args] of this._evaluateOnNewDocument) {
			await this.page.evaluateOnNewDocument(fn, ...args);
		}
	}

	_acceptAllDialogs() {
		this.page.on('dialog', dialog => {
			log.info('Dialog appeared on page!', dialog);
			dialog.accept().catch(err => log.error(err));
		});
	}

	_catchPageErrors() {
		this.page.on('error', err => {
			log.error('page error:', err.stack || err);
		});
	}
}
