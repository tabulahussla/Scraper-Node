import createClient from 'resource-broker-client';
import config from 'config';

export default createClient(config.get('resource-broker'));
