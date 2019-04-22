import showAsciiArt from "~/ascii-art";
import "~/common/catch";
import bootstrapPipeline from "./bootstrap";

showAsciiArt();
bootstrapPipeline();

// eslint-disable-next-line no-process-exit
process.once("SIGUSR2", () => setTimeout(() => process.exit(0), 200));
