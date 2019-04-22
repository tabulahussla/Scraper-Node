import config from "config";

export let DISABLE_PROXIES: boolean = config.get("disableProxies");

export function setDisableProxies(value) {
	DISABLE_PROXIES = value;
}
