import "mocha";
import amqp from "amqplib";
import sendJSONToQueue from "~/common/queue/send-json-to-queue";
import { waitForAck } from "~/common/queue/test/consumer-ack";
import { amqpConnection } from "~/database/amqp";
import { ConsumedQueues } from "~/bootstrap/steps/consume-queues";
import { ok } from "assert";
import { IContract } from "@xxorg/appdb-client";
import { loadPlugin } from "~/plugins";
import testPlugin from "./fixtures/test-plugin";

describe("Queues", () => {
	let channel: amqp.Channel;

	before(async () => {
		loadPlugin(testPlugin);
		channel = await amqpConnection.createChannel();
	});

	it("should consume every configured queue", async () => {
		ok(ConsumedQueues.length > 0, "no consumed queeus");

		const testMessage: IContract<any> = {
			site: "test.ru",
			section: "test-http",
			request: {},
		};

		for (const queue of ConsumedQueues) {
			sendJSONToQueue(channel, queue, testMessage);
			await waitForAck({ queue, message: testMessage });
		}
	});
});
