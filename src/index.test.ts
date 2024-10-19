import { checkDocuments } from './lib/markdown.js';
import { jest } from '@jest/globals';

jest.spyOn(console, 'error').mockReturnValue();
jest.spyOn(console, 'log').mockReturnValue();

describe('run on test_data', () => {
	test('their should be no errors', async () => {
		const directory = new URL('../test_data', import.meta.url).pathname;
		const result = await checkDocuments(directory);
		const { errors } = result;
		expect(errors.length).toBe(3);
		expect(errors[0].toString()).toBe('Unknown link found "sub/doc2.md#header-1" in "doc1.md"');
		expect(errors[1].toString()).toBe('Unknown link found "doc1.md#header-3" in "doc1.md", "sub/doc2.md"');
		expect(errors[2].toString()).toBe('External link unreachable "https://www.google12.com" in "doc1.md"');
	})
})
