import { callbackify } from 'util';

export default function wrapService(service) {
	const copy = {};

	for (const key in service) {
		copy[key] = callbackify(service[key]);
	}

	return copy;
}
