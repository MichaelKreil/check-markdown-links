import { forEachAsync } from 'work-faster';
import { getDocuments } from './document.js';
import { CheckErrors, Source } from './error.js';
import { checkLink } from './external_link.js';
import { closest } from 'fastest-levenshtein';
import { dirname, join } from 'node:path';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

export async function checkDocuments(directory: string): Promise<CheckErrors> {
	const { documents, linksKnown } = await getDocuments(directory);

	const errors = new CheckErrors();
	const linksExt = new Map<string, Source[]>();
	const linksInt = new Map<string, Source[]>();

	documents.forEach(document => {
		const $ = cheerio.load(document.html);
		$('[href]').each((i, e) => check(e, 'href'));
		$('[src]').each((i, e) => check(e, 'src'));

		function check(e: Element, property: string) {
			let url = e.attribs[property];
			const line = parseInt(e.attribs['data-line'], 10);

			if (!url) return;
			if (url.length < 1) return;
			url = decodeURIComponent(url);

			const source: Source = { filename: document.url, line }

			if (url.startsWith('http://') || url.startsWith('https://')) return addLinkOut(url, source, true);
			if (url.startsWith('#')) return addLinkOut(document.url + url, source);
			addLinkOut(join(dirname(document.url), url), source)
		}
	})

	const entriesInt = Array.from(linksInt.entries());
	console.log(`checking ${entriesInt.length} internal links`)
	for (const [link, filenames] of entriesInt) {
		if (linksKnown.has(link)) continue;

		errors.add(`Unknown link found "${link}"`, filenames, 'Maybe you mean: ' + findAlternative(link, linksKnown));
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

		errors.add(`External link unreachable "${link}"`, filenames, 'Got status: ' + error);
	})

	return errors;


	function addLinkOut(href: string, source: Source, external?: true) {
		const map = external ? linksExt : linksInt;
		const entry = map.get(href);
		if (entry) {
			entry.push(source);
		} else {
			map.set(href, [source]);
		}
	}

	function findAlternative(name: string, set: Set<string>): string {
		if (set.size === 0) return '?';

		const list = Array.from(set.values());
		return closest(name, list);
	}

}
