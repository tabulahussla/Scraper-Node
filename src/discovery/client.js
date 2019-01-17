import discoveryClient from 'discovery-client';

export let client;
export function init(options) {
	client = discoveryClient(options);
}
