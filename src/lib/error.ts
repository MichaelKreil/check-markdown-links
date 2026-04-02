import { styleText } from 'node:util';

export interface Source {
	filename: string;
	line: number;
}

export class CheckError {
	errType: string;
	sourceString: string;
	message: string;
	constructor(errType: string, sources: Source[], message: string) {
		const mapFileSources = new Map<string, number[]>();
		sources.forEach((s) => {
			const entry = mapFileSources.get(s.filename);
			if (entry) {
				entry.push(s.line);
			} else {
				mapFileSources.set(s.filename, [s.line]);
			}
		});

		this.sourceString = Array.from(mapFileSources.entries())
			.map(([f, l]: [string, number[]]) => {
				return `${f} (L:${l.sort((a, b) => a - b).join(',')})`;
			})
			.join(', ');

		this.errType = errType;
		this.message = message;
	}
	print(): void {
		console.error(styleText('red', `\n${this.errType}`));
		console.error('   ' + styleText('gray', 'Used in: ') + this.sourceString);
		console.error('   ' + styleText('gray', this.message));
	}
	toString(): string {
		return this.errType + ' in ' + this.sourceString;
	}
}

export class CheckErrors {
	errors: CheckError[] = [];
	constructor() {}
	add(type: string, sources: Source[], message: string) {
		const error = new CheckError(type, sources, message);
		error.print();
		this.errors.push(error);
	}
	isEmpty(): boolean {
		return this.errors.length === 0;
	}
}
