import EventEmitter from 'eventemitter2';

export const emitter = new EventEmitter({
	wildcard: true,
	delimiter: '.',
	verboseMemoryLeak: true,
	ignoreErrors: false,
});
