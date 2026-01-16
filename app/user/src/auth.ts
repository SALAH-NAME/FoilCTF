
import	express, { Request }				from 'express';
import	passport					from 'passport';
import	dotenv						from 'dotenv'
import	FortyTwoStrategy				from 'passport-42';
import  {User, FortyTwoProfile, DonePassport}		from './types';

const   Port:           number  = Number(process.env.PORT ?? "8080");
const   AppId:          string  = process.env.FORTYTWO_APP_ID ?? "ID";
const   AppSecret:      string  = process.env.FORTYTWO_APP_SECRET ?? "42Secret";
const   SessionSecret:  string  = process.env.SESSION_SECRET ?? "SSecret";

async function  verifyUser(
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
}

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
        }, verifyUser));

passport.serializeUser((user: User, done): void => {
        done(null, user);
});

// DATA BASE!
//passport.deserializeUser(async (id: string, done): void => {
//      const   user = db.findUserById(id);
//      done(null, user);
//})

passport.deserializeUser((user: User, done): void => {
        done(null, user);
});
