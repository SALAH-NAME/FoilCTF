
import	{ User, FortyTwoProfile}	from '../utils';

export	class AuthService {
	async	onLogin(user: User) {
		// update db
		return user;
	}
	async	onRegister(profile: FortyTwoProfile): Promise<User> {
		const	newUser = {
			id:		profile.id,
			username:	profile.username,
			kind:		'student',
			displayname:	profile.displayName
		};
		return newUser;
	}
}

export	const authService = new	AuthService;
