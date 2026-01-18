import	{Port}		from './types/env';
import	{Strategy}					from './auth/passport';
import	{Server}					from './auth/server';

const	strategy = new Strategy();
strategy.serializeUser();
strategy.deserializeUser();

const	server = new Server();
server.listen(Port);
