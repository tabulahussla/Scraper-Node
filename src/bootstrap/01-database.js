import config from 'config';
import connectToMongodb from 'database/mongodb';

export default async function connectDatabases() {
	await establishMongodbConnection();
}

export async function establishMongodbConnection() {
	const { url, options } = config.get('mongodb');

	await connectToMongodb({ url, options });
}
