import discoveryClient from 'discovery-client';
import config from 'config';

const client = discoveryClient(config.get('discovery').client);

export default client;
export async function connectAndRegister() {}
