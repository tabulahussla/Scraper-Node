import QueueRegistry from './registry.class';
import config from 'config';

export default new QueueRegistry(config.get('queues'));
