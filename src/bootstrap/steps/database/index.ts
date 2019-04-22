import connectAmqpConfigured from "./amqp";

export default async function connectDatabases() {
	await connectAmqpConfigured();
}
