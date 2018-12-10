import config from 'config';
import redis from 'redis';
import bluebird from 'bluebird';
import retry_strategy from './retry-strategy';

bluebird.promisifyAll(redis);

export default redis.createClient({ ...config.get('redis'), retry_strategy });
