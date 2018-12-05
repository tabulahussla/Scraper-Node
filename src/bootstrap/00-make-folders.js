import mkdirp from 'mkdirp';
import { resolve } from 'path';
import config from 'config';

const FoldersToMake = [...config.get('make-folders')];

export default async function makeFolders() {
	for (const dir of FoldersToMake) {
		const fullPath = resolve(dir);

		await mkdirp(fullPath);
	}
}
