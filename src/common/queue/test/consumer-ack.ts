import EventEmitter from "events";
import equal from "fast-deep-equal";
import log from "~/common/log";

const ConsumerAcknowledgement = new EventEmitter();

export default ConsumerAcknowledgement;

export function waitForAck({
	queue: awaitedQueue,
	message: referenceMessage,
}: {
	queue: string;
	message: object;
}) {
	return new Promise((resolve, reject) => {
		const ackHandler = ({
			queue,
			message,
		}: {
			queue: string;
			message: object;
		}) => {
			if (queue === awaitedQueue && equal(message, referenceMessage)) {
				log.trace("ack %s", queue);
				resolve();
				ConsumerAcknowledgement.off("ack", ackHandler);
				ConsumerAcknowledgement.off("nack", nackHandler);
			}
		};
		const nackHandler = ({
			queue,
			message,
		}: {
			queue: string;
			message: object;
		}) => {
			if (queue === awaitedQueue && equal(message, referenceMessage)) {
				log.trace("nack %s", queue);
				reject();
				ConsumerAcknowledgement.off("ack", ackHandler);
				ConsumerAcknowledgement.off("nack", nackHandler);
			}
		};
		ConsumerAcknowledgement.on("ack", ackHandler).on("nack", nackHandler);
	});
}
