import pino, { stdSerializers } from 'pino';
import config from 'config';

const isDev = process.env.NODE_ENV !== 'production';
const prettyOptions = {
	translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
	ignore: 'name,pid,hostname',
};

const log = pino({
	safe: true,
	name: config.get('project-name'),
	level: config.get('log-level'),
	prettyPrint: isDev && prettyOptions,
	serializers: {
		err: stdSerializers.err,
	},
});

export default log;
