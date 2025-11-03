import { RoleName } from '@/role/role.enum';

export interface SessionUser {
	id: string;
	email: string;
	emailVerified: boolean;
	name: string;
	avatarUrl: string | null;
	roles?: RoleName[];
}
