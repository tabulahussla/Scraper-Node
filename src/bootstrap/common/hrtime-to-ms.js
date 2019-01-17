export const MS_PER_NS = 1000 * 1000;
export const MS_PER_S = 1000;

export default function hrtimeToMsFixed([s, ns]) {
	return (s * MS_PER_S + ns / MS_PER_NS).toFixed(6);
}
