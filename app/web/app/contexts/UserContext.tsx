import { createContext, type Dispatch, type SetStateAction } from 'react';

import type { SessionUser } from '~/session.server';

export type UserContextValue = {
	userState: SessionUser;
	setUserState: Dispatch<SetStateAction<SessionUser>>;
	logoutUserState: () => void;
};
export const UserContext = createContext<UserContextValue | null>(null);
