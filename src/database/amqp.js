import amqp from 'amqplib';

/** @type {amqp.Connection} */
export let amqpConnection;

export async function connect(uriOrOptions) {
	amqpConnection = await amqp.connect(uriOrOptions);
}
