import jayson from 'jayson';
import { wrapJaysonMethods } from 'util/jayson-methods-async-wrapper';

import publicApi from './methods/public-api';

export default new jayson.Server(
	// @ts-ignore
	wrapJaysonMethods({
		...publicApi,
	}),
);
