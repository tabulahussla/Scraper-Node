import amqp from "amqplib";

export let amqpConnection: amqp.Connection;

export async function connect(uriOrOptions) {
	amqpConnection = await amqp.connect(uriOrOptions);
}
