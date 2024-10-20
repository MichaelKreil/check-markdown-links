import 'colors';

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
		sources.forEach(s => {
			const entry = mapFileSources.get(s.filename);
			if (entry) {
				entry.push(s.line);
			} else {
				mapFileSources.set(s.filename, [s.line]);
			}
		});

		this.sourceString = Array.from(mapFileSources.entries()).map(([f, l]: [string, number[]]) => {
			return `${f} (L:${l.sort((a, b) => a - b).join(',')})`;
		}).join(', ');



		this.errType = errType;
		this.message = message;
		console.error(`\n${errType}`.red);
		console.error('   Used in: '.grey + this.sourceString);
		console.error('   ' + message.grey);
	}
	toString(): string {
		return this.errType + ' in ' + this.sourceString;
	}
}

export class CheckErrors {
	errors: CheckError[] = [];
	constructor() { };
	add(type: string, sources: Source[], message: string) {
		this.errors.push(new CheckError(type, sources, message));
	}
	isEmpty(): boolean {
		return this.errors.length === 0;
	}

}
