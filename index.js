'use strict'

import Metalsmith from 'metalsmith';
import 'colors';
import 'work-faster';
import markdown from '@metalsmith/markdown'
import { dirname, join } from 'node:path';
import { closest } from 'fastest-levenshtein';


let errorCount = 0;

const directory = process.cwd();
const tempDirectory = 'temp-check-markdown-links';

const metalsmith = new Metalsmith(directory);
metalsmith.source('.');
metalsmith.clean();
metalsmith.ignore([['.*', '.git']]);
metalsmith.destination(tempDirectory);
metalsmith.use(markdown({ engineOptions: { pedantic: false, gfm: true } }))

let files = await metalsmith.process();
files = Array.from(Object.entries(files)).map(f => {
	f[1].name = f[0];
	return f[1]
});
await check_html(files);

if (errorCount === 0) {
	process.exit(0);
} else {
	process.exit(1);
}

async function check_html(files) {
	const linksKnown = new Set();
	const linksExt = new Map();
	const linksInt = new Map();
	files.forEach(file => {
		if (file.name.startsWith('.')) return;

		if (file.name.endsWith('.html')) {
			let orig_filename = file.name.replace(/\.html?$/i, '.md');
			linksKnown.add(orig_filename);

			let html = file.contents.toString('utf8');

			for (let m of html.matchAll(/ id=\"(.*?)\"/g)) {
				linksKnown.add(orig_filename + '#' + m[1]);
			}

			for (let m of html.matchAll(/ (href|src)=\"(.*?)\"/g)) {
				m = decodeURIComponent(m[2]);
				if (m.startsWith('http://') || m.startsWith('https://')) {
					addLinkOut(m, orig_filename, true)
				} else if (m.startsWith('#')) {
					addLinkOut(orig_filename + m, orig_filename)
				} else {
					addLinkOut(join(dirname(orig_filename), m), orig_filename)
				}
			}
		} else {
			linksKnown.add(file.name);
		}
	})

	let entriesInt = Array.from(linksInt.entries());
	console.log(`checking ${entriesInt.length} internal links`)
	for (let [link, filenames] of entriesInt) {
		if (linksKnown.has(link)) continue;
		console.error(`\nUnknown link found: ${link}`.red);
		console.error('   Used in: '.grey + filenames.join(', '));
		console.error('   Maybe you mean: '.grey + findAlternative(link, linksKnown).green);
		errorCount += 1;
	}

	let entriesExt = Array.from(linksExt.entries());
	console.log(`checking ${entriesExt.length} external links`)
	await entriesExt.forEachAsync(async ([link, filenames]) => {
		let error;
		try {
			let response = await fetch(link, {
				headers: {
					'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
					'accept-language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
				}
			});
			if (response.status === 200) return;
			error = response.status;
		} catch (err) {
			error = err.toString();
		}
		console.error(`\nExternal link unreachable: ${link}`.red);
		console.error('   Used in: '.grey + filenames.join(', '));
		console.error('   Got status: '.grey + error);
		errorCount += 1;
	})


	function addLinkOut(href, filename, external) {
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

	function findAlternative(name, set) {
		if (set.size === 0) return '?';

		let list = Array.from(set.values());
		return closest(name, list);
	}

}
