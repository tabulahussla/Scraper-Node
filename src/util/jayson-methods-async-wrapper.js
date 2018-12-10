import jayson from 'jayson';
import { callbackify } from 'util';
import { ObjectId } from 'bson';

export function wrapJaysonMethods(methods) {
	const res = {};
	for (const key in methods) {
		res[key] = wrapAsyncFnForJayson(methods[key]);
	}
	return res;
}

export function wrapAsyncFnForJayson(fn) {
	const method = callbackify(fn);
	return new jayson.Method({
		handler(args, cb) {
			if (args[0] && args[0]._id) {
				try {
					args[0]._id = new ObjectId(args[0]._id);
				} catch (e) {
					return cb({ code: 500, message: e.message, data: e.data || e.code });
				}
			}
			// @ts-ignore
			method(...args, (err, res) => {
				if (err) {
					cb({
						code: 500,
						message: err.message,
						data: err.data || err.code,
					});
				} else {
					cb(null, res);
				}
			});
		},
		collect: true,
	});
}
