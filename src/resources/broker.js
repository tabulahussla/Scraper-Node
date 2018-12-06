import { ResourceBrokerClient } from 'resource-broker-client';
import config from 'config';

export default new ResourceBrokerClient(config.get('resource-broker'));
