import { RoleName } from '@/role';

export interface SessionUser {
	id: string;
	email: string;
	emailVerified: boolean;
	name: string;
	avatarUrl: string | null;
	roles?: RoleName[];
}
