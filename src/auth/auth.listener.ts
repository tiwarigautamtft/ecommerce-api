import { emitter } from '@/lib/events/emitter';
import { UserEvent } from '@/user';

export function registerListeners() {
	emitter.on(UserEvent.DELETED, function (userId) {
		console.log('running clean up for user id: ' + userId);
	});
}
