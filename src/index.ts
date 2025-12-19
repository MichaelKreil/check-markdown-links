import { checkDocuments } from './lib/markdown.js';
import { resolve } from 'node:path';

const directory = resolve(process.cwd(), process.argv[2] ?? '.');

// Parse skip_hosts from environment variable (GitHub Actions sets INPUT_SKIP_HOSTS)
const skipHostsInput = process.env.INPUT_SKIP_HOSTS ?? '';
const skipHosts = new Set(
	skipHostsInput
		.split('\n')
		.map((host) => host.trim())
		.filter((host) => host.length > 0)
);

const errors = await checkDocuments(directory, skipHosts);

if (errors.isEmpty()) {
	process.exit(0);
} else {
	process.exit(1);
}
