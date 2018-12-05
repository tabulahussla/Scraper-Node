import mongodb from 'mongodb';
import { readFileSync } from 'fs';
import ensureIndexes from './ensure-indexes';

/** @type {mongodb.Db} */
export let db;

/**
 * Establish MongoDB Connection with specified URL and Options
 *
 * @export
 * @param {Object} args
 * @param {string} args.url
 * @param {mongodb.MongoClientOptions} args.options
 */
export default async function connectToMongodb({ url, options = {} }) {
	const databaseName = url.substr(url.lastIndexOf('/') + 1);

	/** @type {mongodb.MongoClientOptions} */
	const mongodbOptions = {
		useNewUrlParser: true,
		...options,
	};

	sslOptions(options.ssl, mongodbOptions);

	const connection = await mongodb.MongoClient.connect(
		url,
		mongodbOptions,
	);

	storeDatabaseReference(connection, databaseName);

	await ensureIndexes(db);

	return connection;
}

/**
 * @export
 * @param {mongodb.MongoClient} connection
 * @param {string} databaseName
 * @returns {mongodb.Db}
 */
export function storeDatabaseReference(connection, databaseName) {
	db = connection.db(databaseName);

	return db;
}

/**
 * @export
 * @param {any} [ssl=false]
 * @param {any} [mongodbOptions={}]
 * @returns {any}
 */
export function sslOptions(ssl = false, mongodbOptions = {}) {
	if (ssl === false) {
		return mongodbOptions;
	}

	if (typeof ssl === 'object' && ssl.ca && ssl.key && ssl.key) {
		Object.assign(mongodbOptions, {
			ssl: true,
			sslCA: [readFileSync(ssl.ca)],
			sslKey: readFileSync(ssl.key),
			sslCert: readFileSync(ssl.cert),
			sslValidate: true,
		});
	} else {
		throw new Error(`invalid ssl options: ${ssl}`);
	}

	return mongodbOptions;
}
