import { checkDocuments } from './lib/markdown.js';
import { resolve } from 'node:path';

const directory = resolve(process.cwd(), process.argv[2] ?? '.');
const errors = await checkDocuments(directory);

if (errors.isEmpty()) {
	process.exit(0);
} else {
	process.exit(1);
}
