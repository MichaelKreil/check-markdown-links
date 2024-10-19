import { marked } from 'marked';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export interface Document {
	url: string;
	html: string;
}

export async function getDocuments(directory: string): Promise<Document[]> {
	const documents: Document[] = [];
	await recursiveScan(directory);
	return documents;

	async function recursiveScan(subDirectory: string): Promise<void> {
		const files = await readdir(subDirectory, { withFileTypes: true });

		for (const file of files) {
			const fullPath = join(subDirectory, file.name);

			if (file.isDirectory()) {
				await recursiveScan(fullPath);
			} else if (file.isFile() && fullPath.endsWith('.md')) {
				const markdown = await readFile(fullPath, 'utf-8');
				const html = await marked(markdown);
				documents.push({
					url: relative(directory, fullPath.replace(/\.md$/i, '')),
					html
				});
			}
		}
	}
}

export function getKnownLinks(documents: Document[]): Set<string> {
	const linksKnown = new Set<string>();
	documents.forEach(document => {
		linksKnown.add(document.url);

		console.log(document.html);
		for (const m of document.html.matchAll(/id="(.*?)"/g)) {
			linksKnown.add(document.url + '#' + m[1]);
		}
	})

	return linksKnown;
}