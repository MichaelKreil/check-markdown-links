import { getDocuments } from './lib/document.js';
import { checkDocuments } from './lib/markdown.js';

describe('run on test_data', () => {
	test('their should be no errors', async () => {
		const directory = new URL('../test_data', import.meta.url).pathname;
		const documents = await getDocuments(directory);
		const errors = await checkDocuments(documents);

		expect(errors.isEmpty()).toBe(true);
	})
})
