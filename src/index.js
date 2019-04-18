import 'common/catch';
import bootstrapPipeline from './bootstrap';
import showAsciiArt from 'ascii-art';

showAsciiArt();
bootstrapPipeline();

// eslint-disable-next-line no-process-exit
process.once('SIGUSR2', () => setTimeout(() => process.exit(0), 200));
