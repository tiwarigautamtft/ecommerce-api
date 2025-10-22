export class HttpException extends Error {
	status: number;
	error: any;
	constructor(status: number, message: string, error?: any) {
		super(message);
		this.name = this.constructor.name;
		this.status = status;
		this.error = error;
	}
}
