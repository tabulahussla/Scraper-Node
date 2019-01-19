import config from "config";
import { validateToken } from "../../src/jwt";

const nodeId = config.get("node-id");

void (async function main() {
	let [, , token] = process.argv;

	try {
		const payload = await validateToken(token);

		let { exp, iat, nodeId: tokenNodeId } = payload;
		const timeLeft = exp * 1000 - Date.now();
		iat = new Date(iat * 1000);

		// eslint-disable-next-line no-console
		console.log(
			'Token is valid. Expires in %s ms (issued at %s). It was generated on %s node ("%s")',
			timeLeft,
			iat.toString(),
			tokenNodeId !== nodeId ? "foreign" : "local",
			tokenNodeId,
		);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(err);
		// eslint-disable-next-line no-process-exit
		process.exit(1);
	}
})();
