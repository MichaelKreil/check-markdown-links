'use strict'

import Metalsmith from 'metalsmith';
import 'work-faster';
import markdown from '@metalsmith/markdown'
import { dirname, join } from 'node:path';
import { closest } from 'fastest-levenshtein';
import { forEachAsync } from 'work-faster';
import { checkLink } from './lib/external_link.js';
import { CheckErrors } from './lib/error.js';

const directory = process.cwd();
const tempDirectory = 'temp-check-markdown-links';

const metalsmith = new Metalsmith(directory);
metalsmith.source('.');
metalsmith.clean();
metalsmith.ignore(['node_modules', '.*', '.git']);
metalsmith.destination(tempDirectory);
metalsmith.use(markdown({ engineOptions: { pedantic: false, gfm: true } }))

const fileMap = await metalsmith.process();
const fileList = Array.from(Object.entries(fileMap)).map(f => ({
	name: f[0],
	contents: f[1].contents,
}));
const errors = await check_html(fileList);

if (errors.isEmpty()) {
	process.exit(0);
} else {
	process.exit(1);
}

async function check_html(files: { name: string, contents: Buffer }[]): Promise<CheckErrors> {
	const errors = new CheckErrors();
	const linksKnown = new Set<string>();
	const linksExt = new Map();
	const linksInt = new Map();
	files.forEach(file => {
		if (file.name.startsWith('.')) return;

		if (file.name.endsWith('.html')) {
			const orig_filename = file.name.replace(/\.html?$/i, '.md');
			linksKnown.add(orig_filename);

			const html = file.contents.toString('utf8');

			for (const m of html.matchAll(/ id="(.*?)"/g)) {
				linksKnown.add(orig_filename + '#' + m[1]);
			}

			for (const match of html.matchAll(/ (href|src)="(.*?)"/g)) {
				const url = decodeURIComponent(match[2]);
				if (url.startsWith('http://') || url.startsWith('https://')) {
					addLinkOut(url, orig_filename, true)
				} else if (url.startsWith('#')) {
					addLinkOut(orig_filename + url, orig_filename)
				} else {
					addLinkOut(join(dirname(orig_filename), url), orig_filename)
				}
			}
		} else {
			linksKnown.add(file.name);
		}
	})

	const entriesInt = Array.from(linksInt.entries());
	console.log(`checking ${entriesInt.length} internal links`)
	for (const [link, filenames] of entriesInt) {
		if (linksKnown.has(link)) continue;

		errors.add(`Unknown link found: ${link}`, filenames, 'Maybe you mean: ' + findAlternative(link, linksKnown));
	}

	const entriesExt = Array.from(linksExt.entries());
	console.log(`checking ${entriesExt.length} external links`)
	await forEachAsync(entriesExt, async ([link, filenames]) => {
		let error;

		try {
			await checkLink(link);
			return;
		} catch (err) {
			error = String(err);
		}

		errors.add(`External link unreachable: ${link}`, filenames, 'Got status: ' + error);
	})

	return errors;


	function addLinkOut(href: string, filename: string, external?: true) {
		if (external) {
			if (linksExt.has(href)) {
				linksExt.get(href).push(filename);
			} else {
				linksExt.set(href, [filename]);
			}
		} else {
			if (linksInt.has(href)) {
				linksInt.get(href).push(filename);
			} else {
				linksInt.set(href, [filename]);
			}
		}
	}

	function findAlternative(name: string, set: Set<string>): string {
		if (set.size === 0) return '?';

		const list = Array.from(set.values());
		return closest(name, list);
	}

}
