export const MSEC_PER_NSEC = 1e6;
export const MSEC_PER_SEC = 1000;
export const SEC_PER_NSEC = MSEC_PER_SEC * MSEC_PER_NSEC;

export function hrtimeToMsec([s, ns]) {
	return s * MSEC_PER_SEC + ns / MSEC_PER_NSEC;
}

export function hrtimeToSec([s, ns]) {
	return s + ns / SEC_PER_NSEC;
}
