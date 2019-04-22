import config from "config";
import mkdirp from "mkdirp";
import { resolve } from "path";
import { promisify } from "util";

const mkdirpAsync = promisify(mkdirp);

const configuration: string[] = config.get("make-folders");
const FoldersToMake = [...configuration];

export default async function makeFolders() {
	for (const dir of FoldersToMake) {
		const fullPath = resolve(dir);

		await mkdirpAsync(fullPath);
	}
}
