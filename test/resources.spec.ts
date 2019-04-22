import "mocha";
import * as flags from "~/flags";
import { acquireResources, reuseResoruces } from "~/scraping/worker";
import { ok } from "assert";
import config from "config";
// import testAccount from "./fixtures/resources/test-account.json";
// import testProxy from "./fixtures/resources/test-proxy.json";
// import { resourceBroker } from "~/resources/broker";

describe("Working with resources", () => {
	before(async () => {
		// TODO: ability to push resource to pool. for now use mongodb
		// await resourceBroker.push(testProxy, "test_proxies");
		// await resourceBroker.push(testAccount, "test_accounts");
	});

	it("should acquire all resources for site as configured", async () => {
		flags.setDisableProxies(false);
		const siteConfiguration: ISiteConfig[] = config.get("sites");
		for (const site of siteConfiguration) {
			const acquiredResoruces = await acquireResources(site.name);
			await reuseResoruces(acquiredResoruces);
			for (const { type } of site.resources) {
				ok(
					acquiredResoruces[type],
					`acquired resources has no resource with type ${type}`
				);
			}
		}
	});

	it("should omit proxy resource if proxies are disabled", async () => {
		flags.setDisableProxies(false);
		let resources = await acquireResources("test-proxies.ru");
		await reuseResoruces(resources);
		ok(resources.proxy);
		flags.setDisableProxies(true);
		resources = await acquireResources("test-proxies.ru");
		ok(!resources.proxy);
	});
});
