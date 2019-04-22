import { Channel } from "amqplib";

export default function sendJSONToQueue(
	channel: Channel,
	queue: string,
	data: object
) {
	const buffer = Buffer.from(JSON.stringify(data));
	return channel.sendToQueue(queue, buffer);
}
