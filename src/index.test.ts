import { checkDocuments } from './lib/markdown.js';
import { vi } from 'vitest';

vi.spyOn(console, 'error').mockReturnValue();

describe('run on test_data', () => {
	test('their should be no errors', async () => {
		const directory = new URL('../test_data', import.meta.url).pathname;
		const result = await checkDocuments(directory);
		const { errors } = result;
		expect(errors.length).toBe(3);
		expect(errors[0].toString()).toBe('Unknown link found "sub/doc2.md#header-1" in doc1.md (L:8), sub/doc2.md (L:4,6)');
		expect(errors[1].toString()).toBe('Unknown link found "doc1.md#header-3" in doc1.md (L:9), sub/doc2.md (L:5)');
		expect(errors[2].toString()).toBe('External link unreachable "https://this-domain-would-only-be-bought-by-someone-who-is-bored-and.rich" in doc1.md (L:12)');
	})
})
