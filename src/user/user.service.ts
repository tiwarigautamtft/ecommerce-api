import { emitter } from '@/lib/events/emitter';
import { generatePreferences } from '@/lib/utils';
import { Tag } from '@/tag/tag.model';

import { UserPreference } from './user-preference.model';
import { UserEvent } from './user.event';
import { User } from './user.model';

export const userService: UserService = {
	getUserById: async (userId) => {
		return User.findByPk(userId);
	},
	deleteUserById: async (userId) => {
		await User.destroy({ where: { id: userId } });

		emitter.emit(UserEvent.DELETED, userId);
	},

	getPreferences: async (userId) => {
		return UserPreference.findAll({ where: { userId } });
	},

	updatePreferences: async (userId, tagNames) => {
		const user = await userService.getUserById(userId);
		if (!user) {
			console.error(`User (${userId}) not found. Preferences not updated`);
			return;
		}

		const existingPreferences = (await UserPreference.findAll({
			where: { userId },
			attributes: ['weight'],
			include: [{ model: Tag, attributes: ['name'] }],
			fieldMap: { 'tag.name': 'tag' },
			raw: true,
		})) as unknown as { tag: string; weight: number }[];

		const preferences = await generatePreferences(
			tagNames,
			'viewed',
			existingPreferences,
		);

		console.log(preferences);

		const updatedPreferredTags = await Tag.findAll({
			where: { name: preferences.map((pref) => pref.tag) },
		});

		const tagNameToWeight = preferences.reduce(
			(acc, pref) => {
				acc[pref.tag] = pref.weight;
				return acc;
			},
			{} as Record<string, number>,
		);

		await UserPreference.bulkCreate(
			updatedPreferredTags.map((tag) => ({
				userId,
				tagId: tag.id,
				weight: tagNameToWeight[tag.name],
			})),
			{ ignoreDuplicates: true },
		);
	},
};

interface UserService {
	getUserById: (userId: string) => Promise<User | null>;
	deleteUserById: (userId: string) => Promise<void>;
	getPreferences: (userId: string) => Promise<UserPreference[]>;
	updatePreferences: (userId: string, tagNames: string[]) => Promise<void>;
}
