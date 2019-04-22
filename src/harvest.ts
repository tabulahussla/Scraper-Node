import { Channel } from "amqplib";
import { amqpConnection } from "~/database/amqp";

export let channel: Channel;
export const queue = "harvesting";

export default async function harvest(artifact, contract) {
	const buffer = Buffer.from(JSON.stringify({ artifact, contract }));
	await channel.sendToQueue(queue, buffer);
}

export async function setupChannel() {
	channel = await amqpConnection.createChannel();
	await channel.assertQueue(queue);
}
