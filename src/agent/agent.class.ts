import config from "config";
import { EventEmitter } from "events";
import { writeFile } from "fs-extra";
import { ObjectId } from "mongodb";
import path from "path";
import puppeteer, { Browser, Page } from "puppeteer";
import log from "~/common/log";

const { defaultLanguages, defaultNavigationTimeout } = config.get("agent");

export default class Agent extends EventEmitter {
	public resources: any[];
	// tslint:disable-next-line: variable-name
	private _proxy: IProxy;
	// tslint:disable-next-line: variable-name
	private _account: IAccount;
	// tslint:disable-next-line: variable-name
	private _id: string;
	private puppeteerOptions: any;
	private languages: any;
	private extraHTTPHeaders: {};
	private evaluateOnNewDocument: any[];
	private page: Page | null = null;
	private browser: Browser | null = null;
	private isDestroyed: boolean;
	private authentication?: { username: any; password: any };
	private viewport: any;
	private userAgent: any;

	/**
	 * Creates an instance of Agent.
	 *
	 * @param {Object} options
	 * @param {IProxy} options.proxy
	 * @param {IAccount} options.account
	 * @param {puppeteer.LaunchOptions} options.puppeteerOptions
	 * @param {IResource[]} options.resources
	 * @memberof Agent
	 */
	constructor({ proxy, account, puppeteerOptions, resources }) {
		super();

		this.resources = [...resources];

		this._proxy = proxy;
		this._account = account;

		this.puppeteerOptions = {
			...puppeteerOptions,
			args: puppeteerOptions.args || [],
		};
		this.languages = defaultLanguages;
		this.extraHTTPHeaders = {};
		this.evaluateOnNewDocument = [];

		// @ts-ignore
		this._id = new ObjectId().toString("binary");

		process.once("SIGUSR2", () => this.destroy());

		this.isDestroyed = false;
	}

	public get proxy() {
		return this._proxy;
	}
	public get account() {
		return this._account;
	}
	public get id() {
		return this._id;
	}

	public async init() {
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
		if (Array.isArray(this.languages) && this.languages.length > 0) {
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
	public async click(selector, options) {
		if (this.page === null) {
			throw new Error(`Cannot click on ${selector}: agent has no page`);
		}

		const mouse = this.page.mouse;

		const elementHandle = await this.page.$(selector);

		if (elementHandle === null) {
			throw new Error(
				`Cannot click on ${selector}: no element is present on page`
			);
		}

		// @ts-ignore
		let { x, y } = await elementHandle._clickablePoint();
		const boundingBox = await elementHandle.boundingBox();

		if (boundingBox === null) {
			throw new Error(
				`Cannot click on ${selector}: cannot extract bounding box`
			);
		}

		const { width, height } = boundingBox;

		x += (Math.random() - 0.5) * width;
		y += (Math.random() - 0.5) * height;

		await mouse.click(x, y, options || {});
	}

	public async destroy() {
		if (this.isDestroyed) {
			return;
		}
		if (this.browser) {
			await this.browser.close();
			this.page = null;
			this.browser = null;
		}
		this.isDestroyed = true;
		this.emit("destroy");
	}

	public async dumpHtml(label) {
		let html;
		const filePath = path.resolve("storage/dumps/html", label + ".html");
		try {
			if (this.page === null) {
				throw new Error(`Failed to extract html – agent has no page`);
			}

			html = await this.page.evaluate(
				() => document.documentElement.outerHTML
			);
		} catch (err) {
			log.warn("failed to extract page source");
			log.warn({ err });
		}

		if (!html) {
			return;
		}

		try {
			await writeFile(filePath, html);
		} catch (err) {
			log.warn("failed to write file");
			log.warn({ err });
		}
	}

	public async screenshot(filename) {
		if (this.page === null) {
			throw new Error(`Failed to capture screenshot: agent has no page`);
		}

		const outputPath = path.resolve("storage/screenshots", filename);
		await this.page.screenshot({
			path: outputPath,
			type: "jpeg",
			quality: 66,
		});
	}

	public _setupProxy() {
		this.puppeteerOptions.args.push(
			`--proxy-server=${this._proxy.protocol}://${this._proxy.host}:${
				this._proxy.port
			}`
		);
	}

	public _setupProxyAuth() {
		const { username, password } = this._proxy;

		if (username && password) {
			this.puppeteerOptions.ignoreHTTPSErrors = true;
			this.authentication = {
				username: this._proxy.username,
				password: this._proxy.password,
			};
		}
	}

	public _setupAccount() {
		this.languages = this._account.languages || this.languages;
		this.puppeteerOptions.userDataDir = path.resolve(
			config.get("profileDir"),
			this._account._id
		);
		this.viewport = this._account.viewport;
		this.userAgent = this._account.userAgent;
	}

	public _setupLocalisation() {
		this.extraHTTPHeaders["Accept-Language"] = this.languages.join(", ");

		this.evaluateOnNewDocument.push([
			languages => {
				/* eslint-env browser */
				Object.defineProperty(navigator, "language", {
					get() {
						return [languages[0]];
					},
				});
				Object.defineProperty(navigator, "languages", {
					get() {
						return languages;
					},
				});
			},
			this.languages,
		]);

		this.puppeteerOptions.args.push(`--lang=${this.languages.join(",")}`);
	}

	public async _createPage() {
		this.browser = await puppeteer.launch(this.puppeteerOptions);
		this.page = await this.browser.newPage();
	}

	public async _setupPage() {
		if (this.page === null) {
			throw new Error(`No page during setup`);
		}

		// setup authentication (for proxy)
		if (this.authentication) {
			await this.page.authenticate(this.authentication);
		}

		// set any extra http headers
		if (
			this.extraHTTPHeaders &&
			Object.keys(this.extraHTTPHeaders).length > 0
		) {
			await this.page.setExtraHTTPHeaders(this.extraHTTPHeaders);
		}

		// set user agent
		if (this.userAgent) {
			await this.page.setUserAgent(this.userAgent);
		}

		// apply viewport options
		if (this.viewport) {
			const { width, height } = this.viewport;
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
		for (const [fn, ...args] of this.evaluateOnNewDocument) {
			await this.page.evaluateOnNewDocument(fn, ...args);
		}
	}

	public _acceptAllDialogs() {
		this.page!.on("dialog", dialog => {
			log.info("Dialog appeared on page!", dialog);
			dialog.accept().catch(err => log.error(err));
		});
	}

	public _catchPageErrors() {
		this.page!.on("error", err => {
			log.error("page error:", err.stack || err);
		});
	}
}
