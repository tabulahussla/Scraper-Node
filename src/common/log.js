import pino, { stdSerializers } from 'pino';
import config from 'config';

const log = pino({
	safe: true,
	name: config.get('project-name'),
	level: config.get('log-level'),
	prettyPrint: process.env.NODE_ENV !== 'production',
	serializers: {
		err: stdSerializers.err,
	},
});

export default log;
