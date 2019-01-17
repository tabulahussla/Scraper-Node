import jwt from 'jwt-simple';
import config from 'config';

const nodeId = config.get('node-id');
let { secret, algorithm, options } = config.get('jwt');
secret = Buffer.from(secret, 'base64');

export function generateToken({ consumerId, expiresIn }, jwtOptions = {}) {
	const expiresAt = Date.now() + expiresIn;
	const exp = Math.floor(expiresAt / 1000);
	const iat = Math.floor(Date.now() / 1000);
	return jwt.encode({ consumerId, nodeId, exp, iat }, secret, algorithm, {
		...options,
		...jwtOptions,
	});
}

export async function validateToken(token) {
	const payload = jwt.decode(token, secret, false, algorithm);

	return payload;
}
