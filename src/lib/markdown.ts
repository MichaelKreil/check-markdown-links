import { forEachAsync } from 'work-faster';
import { Document, getKnownLinks } from './document.js';
import { CheckErrors } from './error.js';
import { dirname, join } from 'node:path';
import { checkLink } from './external_link.js';
import { closest } from 'fastest-levenshtein';

export async function checkDocuments(documents: Document[]): Promise<CheckErrors> {
	const errors = new CheckErrors();
	const linksKnown = getKnownLinks(documents);
	const linksExt = new Map();
	const linksInt = new Map();
	documents.forEach(d => {
		for (const match of d.html.matchAll(/ (href|src)="(.*?)"/g)) {
			const url = decodeURIComponent(match[2]);
			if (url.startsWith('http://') || url.startsWith('https://')) {
				addLinkOut(url, d.filename, true)
			} else if (url.startsWith('#')) {
				addLinkOut(d.filename + url, d.filename)
			} else {
				addLinkOut(join(dirname(d.filename), url), d.filename)
			}
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
