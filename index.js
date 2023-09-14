'use strict'

import Metalsmith from 'metalsmith';
import 'colors';
import markdown from '@metalsmith/markdown'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { closest } from 'fastest-levenshtein';

const directory = process.cwd();

const tempDirectory = mkdtempSync('check-markdown-links-');

const metalsmith = new Metalsmith(directory);
metalsmith.source('.');
metalsmith.destination(tempDirectory);
metalsmith.use(markdown({ engineOptions: { pedantic: false, gfm: true } }))
await metalsmith.build();

await check_html(tempDirectory);

rmSync(resolve(directory, tempDirectory), { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })

async function check_html(directory) {
	const files = [];
	list_files_rec('');

	const linksKnown = new Set();
	const linksExt = new Map();
	const linksInt = new Map();
	files.forEach(f => {
		if (f.isHtml) {
			let filename = f.rel.replace(/\.html?$/i, '.md');
			linksKnown.add(filename);

			let html = readFileSync(f.abs, 'utf8');

			for (let m of html.matchAll(/ id=\"(.*?)\"/g)) {
				linksKnown.add(filename + '#' + m[1]);
			}

			for (let m of html.matchAll(/ (href|src)=\"(.*?)\"/g)) {
				m = decodeURIComponent(m[2]);
				if (m.startsWith('http://') || m.startsWith('https://')) {
					addLinkOut(m, filename, true)
				} else if (m.startsWith('#')) {
					addLinkOut(filename + m, filename)
				} else {
					addLinkOut(join(dirname(filename), m), filename)
				}
			}
		} else {
			linksKnown.add(f.rel);
		}
	})

	for (let [link, filenames] of linksInt.entries()) {
		if (linksKnown.has(link)) continue;
		console.error(`Unknown link found: ${link}`.red);
		console.error('   Used in: ' + filenames.join(', '));
		console.error('   Maybe you mean: ' + closest(link, Array.from(linksKnown.values())).white);
	}
 
	for (let [link, filenames] of entries) {
		let response = await fetch(link);
		if (response.status === 200) continue;
		console.error(`External link unreachable: ${link}`.red);
		console.error('   Used in: ' + filenames.join(', '));
		console.error('   Got status: ' + response.status);
	}


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

	function list_files_rec(d) {
		let path = resolve(directory, d);
		readdirSync(path).forEach(name => {
			if (name.startsWith('.')) return;

			let abs = resolve(path, name);
			let rel = join(d, name);
			if (statSync(abs).isDirectory()) {
				list_files_rec(rel);
			} else {
				files.push({ rel, abs, isHtml: name.endsWith('.html') })
			}
		})
	}
}
