import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import * as cheerio from 'cheerio';
import type { Root } from 'hast';

const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype)
	.use(extractPositionsHTML)
	.use(rehypeSlug)
	.use(rehypeStringify);

export interface Document {
	url: string;
	html: string;
}

export async function getDocuments(directory: string): Promise<{ documents: Document[]; linksKnown: Set<string> }> {
	const documents: Document[] = [];
	const linksKnown = new Set<string>();

	const files = await readdir(directory, { withFileTypes: true, recursive: true });

	for (const file of files) {
		const name = file.name;
		const parentPath = file.parentPath;

		// skip dotfiles and node_modules
		if (name.startsWith('.')) continue;
		if (name === 'node_modules') continue;
		if (parentPath.includes('/node_modules/') || parentPath.includes('/.')) continue;

		const fullPath = join(parentPath, name);
		const url = relative(directory, fullPath);
		linksKnown.add(url);

		if (file.isFile() && name.endsWith('.md')) {
			const markdown = await readFile(fullPath, 'utf-8');
			const html = (await processor.process(markdown)).toString();
			documents.push({ url, html });
		}
	}

	documents.forEach((document) => {
		const $ = cheerio.load(document.html);
		$('[id]').each((_, e) => {
			const id = e.attribs['id'];
			if (id && id.length > 0) linksKnown.add(document.url + '#' + id);
		});
	});

	return { documents, linksKnown };
}

function extractPositionsHTML(): (tree: Root) => void {
	return (tree: Root) =>
		visit(tree, 'element', (node) => {
			if (node.position) {
				node.properties.dataLine = JSON.stringify(node.position.start.line);
			}
		});
}
