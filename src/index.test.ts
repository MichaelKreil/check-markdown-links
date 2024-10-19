import { getDocuments } from './lib/document.js';
import { checkDocuments } from './lib/markdown.js';
import { jest } from '@jest/globals';

//jest.spyOn(console, 'error').mockReturnValue();
//jest.spyOn(console, 'log').mockReturnValue();

describe('run on test_data', () => {
	test('their should be no errors', async () => {
		const directory = new URL('../test_data', import.meta.url).pathname;
		const documents = await getDocuments(directory);
		const result = await checkDocuments(documents);

		

		expect(result.errors).toStrictEqual([]);
	})
})
