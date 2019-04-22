export default function(options) {
	if (options.total_retry_time > 1000 * 60 * 60) {
		// End reconnecting after a specific timeout and flush all commands
		// with a individual error
		return new Error("Retry time exhausted");
	}
	if (options.attempt > 10) {
		// End reconnecting with built in error
		return undefined;
	}
	// reconnect after
	return Math.min(options.attempt * 100, 3000);
}
