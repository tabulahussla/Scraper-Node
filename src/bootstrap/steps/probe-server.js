import config from 'config';
import setupProbeServer from 'api/probe';

export default async function setupProbe() {
	await setupProbeServer(config.get('probe'));
}
