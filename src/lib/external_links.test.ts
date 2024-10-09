import { checkLink } from './external_link.js';
import { jest } from '@jest/globals';

describe('checkLink with real URLs', () => {
	jest.setTimeout(3000);

	const urls = [
		'https://en.wikipedia.org/wiki/Main_Page',
		'https://github.com/',
		'https://www.github.com/',
		'https://versatiles.org/',
		'https://www.akamai.com/',
		'https://www.google.com/',
	]

	for (const url of urls) {
		const name = url.replace(/^https?:\/\/(www\.)?|\/+$/g, '');
		test('test ' + name, async () => {
			const result = await checkLink(url);
			expect(result).toBe(true);
		})
	}
});
