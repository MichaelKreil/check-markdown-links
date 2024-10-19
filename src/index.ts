import { getDocuments } from './lib/document.js';
import { checkDocuments } from './lib/markdown.js';
import { resolve } from 'node:path';

const directory = resolve(process.cwd(), process.argv[2] ?? '.');
const documents = await getDocuments(directory);
const errors = await checkDocuments(documents);

if (errors.isEmpty()) {
	process.exit(0);
} else {
	process.exit(1);
}
