import 'colors';

export class CheckError {
	errType: string;
	sourceString: string;
	message: string;
	constructor(errType: string, sources: string[], message: string) {
		this.errType = errType;
		this.sourceString = sources.map(s => `"${s}"`).join(', ');
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
	add(type: string, sources: string[], message: string) {
		this.errors.push(new CheckError(type, sources, message));
	}
	isEmpty(): boolean {
		return this.errors.length === 0;
	}

}
