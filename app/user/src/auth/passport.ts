
import	{ Request }				from 'express';
import	passport					from 'passport';
import	FortyTwoStrategy				from 'passport-42';
import  {User, FortyTwoProfile, DonePassport}		from '../types';
import	{Port, AppId, AppSecret}		from '../types/env';

export	class Strategy {
	constructor() {
		passport.use(new FortyTwoStrategy({
			clientID:               AppId,
			clientSecret:           AppSecret,
			callbackURL:            `http://localhost:${Port}/auth/42/callback`,
			passReqToCallback:      true,
			profileFields: {
				'id':           'id',
				'username':     'login',
				'kind':         'kind',
				'displayName':  'displayname',
				}
		}, this.verifyUser));
	};
	private	async verifyUser(
		req:            Request,
		accessToken:    string,
		refreshToken:   string,
		profile:        FortyTwoProfile,
		done:           DonePassport) {
		try {
			if (!profile || profile._json.kind !== 'student')
				return done(null, false);
			const   user = {
				id:             profile.id,
				username:       profile.username,
				kind:           profile._json.kind,
				displayname:    profile.displayName
			};

			return done(null, user);
		} catch (error) {
			return done(error instanceof Error ? error : new Error("Auth Failed"));
		}
	};

	serializeUser() {
		passport.serializeUser((user: User, done): void => {
			done(null, user);
		});
	};

	// DATA BASE!
	//passport.deserializeUser(async (id: string, done): void => {
	//      const   user = db.findUserById(id);
	//      done(null, user);
	//})

	deserializeUser() {
		passport.deserializeUser((user: User, done): void => {
			done(null, user);
		});
	};
};

