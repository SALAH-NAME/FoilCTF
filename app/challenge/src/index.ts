import { config as env_load } from 'dotenv';
import express, { type Request, type Response, type NextFunction } from 'express';

env_load({ quiet: true });
const env = {
	port: Number(process.env["SERVICE_API_PORT"] ?? "8080"),
	host: process.env["SERVICE_API_HOST"] ?? "127.0.0.1",
}

async function route_challenges_list(req: Request, res: Response): Promise<void> {
	const { id } = req.params;
	res.sendStatus(501);
	res.end();
}

async function middleware_validate_id(req: Request, res: Response, next: NextFunction) {
	// TODO(xenobas): How do we communicate to typescript that the type has changed due to the middleware?
	const { id } = req.params;
	if (typeof id !== "string") {
		res.sendStatus(400);
		return ;
	}

	const re = new RegExp(/^[1-9][0-9]*$/)
	if (!re.test(id)) {
		res.sendStatus(404);
		return ;
	}

	next();
}
async function route_challenges_inspect(req: Request<{ id: string }>, res: Response): Promise<void> {
	const { id } = req.params;

	res.sendStatus(501);
	res.end();
}
async function route_challenges_create(req: Request<{ id: string }>, res: Response): Promise<void> {
	const { id } = req.params;

	res.sendStatus(501);
	res.end();
}
async function route_challenges_update(req: Request<{ id: string }>, res: Response): Promise<void> {
	const { id } = req.params;

	res.sendStatus(501);
	res.end();
}
async function route_challenges_delete(req: Request<{ id: string }>, res: Response): Promise<void> {
	const { id } = req.params;

	res.sendStatus(501);
	res.end();
}

const web = express();
web.get("/api/challenges", route_challenges_list);

web.get("/api/challenges/:id", middleware_validate_id, route_challenges_inspect);
web.post("/api/challenges/:id", middleware_validate_id, route_challenges_create);
web.put("/api/challenges/:id", middleware_validate_id, route_challenges_update);
web.delete("/api/challenges/:id", middleware_validate_id, route_challenges_delete);

web.listen(env.port, env.host, () => {
	console.log(`Listening on port ${env.port}`);
});
