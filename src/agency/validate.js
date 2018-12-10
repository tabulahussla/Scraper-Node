import config from 'config';

const { destroyOnNetworkError } = config.get('agent');

export const ErrorMessageRegExp = [
	/Protocol Error/i,
	/Failed to launch chrome/i,
	/Reached error page/i,
	/Process unexpectedly closed/i,
	/Navigation Timeout Exceeded/i,
	/net::ERR/i,
];

export const NetworkErrorMessageRegExp = [/Navigation Timeout Exceeded/i, /net::ERR/i];

export function checkAgentIsBroken(e) {
	if (!e || !e.message) {
		return false;
	}

	if (ErrorMessageRegExp.some(regExp => regExp.test(e.message))) {
		return true;
	}
}

export function isNetworkError(e) {
	if (!e || !e.message) {
		return false;
	}

	if (
		NetworkErrorMessageRegExp.some(regExp => regExp.test(e.message)) ||
		e.name === 'TimeoutError'
	) {
		return true;
	}
}

export function validateException(e) {
	return checkAgentIsBroken(e) || (destroyOnNetworkError && isNetworkError(e));
}
