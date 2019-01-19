import ms from "ms";

import { generateToken } from "../../src/jwt";

void (async function main() {
	let [, , consumerId, expiresIn] = process.argv;
	expiresIn = ms(expiresIn) || 0;
	const token = generateToken({ consumerId, expiresIn });

	// eslint-disable-next-line no-console
	console.log(
		'Generate token for Client with ID "%s". Token is valid for %s ms',
		consumerId,
		expiresIn,
	);
	process.stdout.write(token);
	process.stdout.write("\n");
})();
