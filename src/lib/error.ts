import 'colors';

export class CheckError {
	constructor(type: string, sources: string[], message: string) {
		console.error(`\n${type}`.red);
		console.error('   Used in: '.grey + sources.join(', '));
		console.error('   ' + message.grey);
	}
}

export class CheckErrors {
	errors: CheckError[] = [];
	constructor() { };
	add(type: string, sources: string[], message: string) {
		this.errors.push(new CheckError(type, sources, message));
	}
	isEmpty(): boolean {
		return this.errors.length === 0;
	}

}
