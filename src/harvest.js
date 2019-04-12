// eslint-disable-next-line no-unused-vars
import amqp from 'amqplib';
import { amqpConnection } from 'database/amqp';

/** @type {amqp.Channel} */
export let channel;
export const queue = 'harvesting';

export default async function harvest(artifact) {
	const buffer = Buffer.from(JSON.stringify(artifact));
	await channel.sendToQueue(queue, buffer);
}

export async function setupChannel() {
	channel = await amqpConnection.createChannel();
	await channel.assertQueue(queue);
}
