import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import { unified } from 'unified'

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype)
	.use(rehypeSlug)
	.use(rehypeStringify)

export interface Document {
	url: string;
	html: string;
}

export async function getDocuments(directory: string): Promise<{ documents: Document[], linksKnown: Set<string> }> {
	const documents: Document[] = [];
	const linksKnown = new Set<string>();

	await recursiveScan(directory);

	documents.forEach(document => {
		for (const m of document.html.matchAll(/ id="(.*?)"/g)) {
			linksKnown.add(document.url + '#' + m[1]);
		}
	})

	return { documents, linksKnown };

	async function recursiveScan(subDirectory: string): Promise<void> {
		const files = await readdir(subDirectory, { withFileTypes: true });

		for (const file of files) {
			if (file.name.startsWith('.')) continue;
			if (file.name === 'node_modules') continue;

			const fullPath = join(subDirectory, file.name);
			const url = relative(directory, fullPath);
			linksKnown.add(url);

			if (file.isDirectory()) {
				await recursiveScan(fullPath);
			} else if (file.isFile() && fullPath.endsWith('.md')) {
				const markdown = await readFile(fullPath, 'utf-8');
				const html = (await processor.process(markdown)).toString();
				documents.push({ url, html });
			}
		}
	}
}
