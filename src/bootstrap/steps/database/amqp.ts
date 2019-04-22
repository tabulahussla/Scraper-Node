import config from "config";
import log from "~/common/log";
import { connect } from "~/database/amqp";
import { setupChannel } from "~/harvest";

export default async function connectAmqpConfigured() {
	const amqpConfig = config.get("amqp");
	await connect(amqpConfig);

	log.debug("connected to amqp");

	await setupChannel();
}
