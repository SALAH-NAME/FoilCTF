import {
	createContext,
	useContext,
	type Dispatch,
	type SetStateAction,
} from 'react';

import type { SessionUser } from '~/session.server';

export type UserProviderValue = {
	userState: SessionUser;
	setUserState: Dispatch<SetStateAction<SessionUser>>;
	logoutUserState: () => void;
	refreshUserState: () => Promise<void>;
};
export const UserProvider = createContext<UserProviderValue | null>(null);

export function useUserAuth() {
	const context = useContext(UserProvider);
	if (!context)
		throw new Error('useUserAuth must be used within a UserProvider');
	return context;
}
