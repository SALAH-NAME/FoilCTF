
import  express, {Request, Response, NextFunction}      from 'express';
import  session                                         from 'express-session';
import  passport                                        from 'passport';
import  path                                            from 'path';
import  {SessionSecret}         from '../types/env';

function      isLoggedIn(req: Request, res: Response, next: NextFunction): void {
      req.user ? next() : res.sendStatus(401);
}

export	class Server {
        public  app = express();

        constructor() {
                this.setupMiddleWares();
                this.setupRoutes();
        };

        private setupMiddleWares() {
                this.app.use(session({  secret:                 SessionSecret,
                                                resave:                 false,
                                                saveUninitialized:      false,
                                                cookie:                 {secure: false} // HTTP
                                        })
                               );
                this.app.use(passport.initialize());
                this.app.use(passport.session());
        };

        private setupRoutes() {
                this.app.get('/', (req: Request, res: Response): void => {
                        res.sendFile(path.join(__dirname, '../public/home.html'));
                });

                this.app.get('/auth/42',
                        passport.authenticate('42')
                );

                this.app.get('/auth/42/callback',
                        passport.authenticate('42', {
                                successRedirect: '/private',
                                failureRedirect: '/auth/failure',
                        })
                );

                this.app.get('/auth/failure', (req: Request, res: Response): void => {
                        res.send('Something went wrong..');
                });

                this.app.get('/private', isLoggedIn, (req: Request, res: Response): void => {
                        res.send(`Hello ${req.user?.displayname ?? "GUEST"}
                                 <br><a href="/logout">logout?</a>`); // button maybe?
                                                                      // to exec logout func
                });

                this.app.get('/logout', (req: Request, res: Response) => {
                        req.logout((err): void => {
                                if (err) {
                                        res.status(500).send('Error loggin out');
                                        return ;
                                }
                                req.session.destroy((err) => {
                                        if (err) {
                                                res.status(500).send('Error loggin out');
                                                return ;
                                        }
                                        //res.send('Goodbye!');
                                        res.clearCookie('connect.sid', { path: '/'});
                                        res.redirect('/');
                                });
                        });
                });
        };

        public  listen(Port: number) {
                this.app.listen(Port, (): void => {
                        console.log(`app listening on port ${Port}`);
                });
        };
}
