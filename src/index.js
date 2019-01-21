import 'common/catch';
import bootstrapPipeline from './bootstrap';
import showAsciiArt from 'ascii-art';

void (async function main() {
	showAsciiArt();
	await bootstrapPipeline();
})();

// eslint-disable-next-line no-process-exit
process.once('SIGUSR2', () => setTimeout(() => process.exit(0), 200));
