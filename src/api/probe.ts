import http from "http";
import log from "~/common/log";
import { isFinished } from "../bootstrap";

export default async function setupProbeServer({ enabled, port }) {
	if (!enabled) {
		return;
	}

	log.info("setupProbeServer %d", port);

	const server = http.createServer((req, res) => {
		if (isFinished) {
			res.statusCode = 200;
			res.end();
		} else {
			res.statusCode = 500;
			res.end();
		}
	});

	await new Promise((resolve, reject) => {
		server.on("error", reject);
		server.on("listening", resolve);

		server.listen(port);
	});

	const address = server.address();

	// @ts-ignore
	log.info("PROBE SERVER LISTENING ON *:%d", address.port);
}
