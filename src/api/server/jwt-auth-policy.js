import { validateToken } from 'jwt';

export default function authenticate(connection, application, strategy, credentials, cb) {
	if (strategy === 'login') {
		const [, token] = credentials;
		if (!token) {
			return cb(new Error('no token'));
		}
		validateToken(token)
			.then(payload => cb(null, payload.consumerId))
			.catch(err => cb(err));
	} else {
		cb(new Error(`invalid strategy ${strategy}`));
	}
}
