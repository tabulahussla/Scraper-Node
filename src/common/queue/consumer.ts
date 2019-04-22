import { Channel } from "amqplib";
import { amqpConnection } from "~/database/amqp";
import log from "../log";
import ConsumerAcknowledgement from "./test/consumer-ack";

declare type TWorker = (options: any) => any;

export default class Consumer {
	private queue: string;
	private worker: TWorker;
	private channel: Channel | null;

	constructor({
		queue,
		worker,
		channel,
	}: {
		queue: string;
		worker: TWorker;
		channel?: Channel;
	}) {
		this.queue = queue;
		this.worker = worker;
		this.channel = channel || null;
	}

	public async createChannel() {
		this.channel = await amqpConnection.createChannel();
	}

	public async consume() {
		if (this.channel === null) {
			throw new Error("Cannot consume without a channel");
		}

		await this.channel.assertQueue(this.queue);
		await this.channel.consume(this.queue, msg => {
			if (msg !== null) {
				let data;
				try {
					// @ts-ignore
					data = JSON.parse(msg.content);
				} catch (err) {
					log.error("failed to parse message", { err });
					this.channel!.nack(msg, false, false);

					ConsumerAcknowledgement.emit("nack", {
						queue: this.queue,
						message: msg.content,
					});

					// Stop execution on error
					return;
				}

				// Successfully parsed "data"
				this.worker(data);
				this.channel!.ack(msg);

				ConsumerAcknowledgement.emit("ack", {
					queue: this.queue,
					message: data,
				});
			}
		});
	}
}
