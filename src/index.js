import 'common/catch';
import bootstrapPipeline from './bootstrap';
import showAsciiArt from 'ascii-art';

void (async function main() {
	showAsciiArt();
	await bootstrapPipeline();
})();
