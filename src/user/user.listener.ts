import { emitter } from '@/lib/events/emitter';

export function registerListeners() {
	emitter.on('user:seller_profile_created', (payload) => {
		console.log('Seller profile created:', payload);
	});
}
