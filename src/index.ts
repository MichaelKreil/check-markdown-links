import { getDocuments } from './lib/document.js';
import { checkDocuments } from './lib/markdown.js';

const directory = process.cwd();
const documents = await getDocuments(directory);
const errors = await checkDocuments(documents);

if (errors.isEmpty()) {
	process.exit(0);
} else {
	process.exit(1);
}
