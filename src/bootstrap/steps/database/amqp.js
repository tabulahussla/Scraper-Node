import config from 'config';
import { connect } from 'database/amqp';
import log from 'common/log';
import { setupChannel } from 'harvest';

export default async function connectAmqpConfigured() {
	const amqpConfig = config.get('amqp');
	await connect(amqpConfig);

	log.debug('connected to amqp');

	await setupChannel();
}
