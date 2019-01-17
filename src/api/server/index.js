import APIServer from './class';
import services from '../services';

export let server;
export function initialize(options) {
	server = new APIServer({ ...options, services });
}
export function listen(options) {
	server.listen(options);
}
