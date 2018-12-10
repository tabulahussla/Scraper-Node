export default function stringifyProxy(
	resource,
	{ includeProtocol = true, includeAuth = false } = {},
) {
	const protocolString = includeProtocol && `${resource.protocol}://`;
	const authString = includeAuth && `${resource.username}:${resource.password}@`;

	return `${protocolString}${authString}${resource.host}:${resource.port}`;
}
