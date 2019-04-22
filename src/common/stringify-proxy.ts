export default function stringifyProxy(
	resource,
	{ includeProtocol = true, includeAuth = false } = {}
) {
	const protocolString = includeProtocol && `${resource.protocol}://`;
	let authString = "";

	if (includeAuth && resource.username && resource.password) {
		authString = `${resource.username}:${resource.password}@`;
	}

	return `${protocolString}${authString}${resource.host}:${resource.port}`;
}
