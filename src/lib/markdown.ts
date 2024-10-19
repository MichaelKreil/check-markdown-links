import { forEachAsync } from 'work-faster';
import { getDocuments } from './document.js';
import { CheckErrors } from './error.js';
import { checkLink } from './external_link.js';
import { closest } from 'fastest-levenshtein';
import { dirname, join } from 'node:path';
import * as cheerio from 'cheerio';

export async function checkDocuments(directory: string): Promise<CheckErrors> {
	const { documents, linksKnown } = await getDocuments(directory);

	const errors = new CheckErrors();
	const linksExt = new Map();
	const linksInt = new Map();

	documents.forEach(d => {
		const $ = cheerio.load(d.html);
		$('[href]').each((i, e) => check(e.attribs['href']));
		$('[src]').each((i, e) => check(e.attribs['src']));

		function check(url: string) {
			if (!url) return;
			if (url.length < 1) return;

			if (url.startsWith('http://') || url.startsWith('https://')) return addLinkOut(url, d.url, true);
			if (url.startsWith('#')) return addLinkOut(d.url + url, d.url);
			addLinkOut(join(dirname(d.url), url), d.url)
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


	function addLinkOut(href: string, source: string, external?: true) {
		if (external) {
			if (linksExt.has(href)) {
				linksExt.get(href).push(source);
			} else {
				linksExt.set(href, [source]);
			}
		} else {
			if (linksInt.has(href)) {
				linksInt.get(href).push(source);
			} else {
				linksInt.set(href, [source]);
			}
		}
	}

	function findAlternative(name: string, set: Set<string>): string {
		if (set.size === 0) return '?';

		const list = Array.from(set.values());
		return closest(name, list);
	}

}
