import { emitter } from '@/lib/events/emitter';

import { UserEvent } from './user.event';
import { User } from './user.model';

export const userService: UserService = {
	deleteUserById: async (userId: string) => {
		await User.destroy({ where: { id: userId } });

		emitter.emit(UserEvent.DELETED, userId);
	},
};

interface UserService {
	deleteUserById: (userId: string) => Promise<void>;
}
