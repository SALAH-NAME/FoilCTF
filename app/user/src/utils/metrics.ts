import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { FoilCTF_Error } from './types';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const teamCreations = new client.Counter({
    name: "foilctf_total_teams_created",
    help: "Total number of teams",
});

export const activeFriendRequests = new client.Counter({
    name: "foilctf_active_friend_requests",
    help: "Current number of pending friend requests",
});

export const activeTeamJoinRequests = new client.Counter({
    name: "foilctf_active_team_join_requests",
    help: "Current number of pending team join requests",
});

export const authRegistries = new client.Counter({
    name: "foilctf_auth_registers",
    help: "Current number of authenticated registries",
});

register.registerMetric(teamCreations);
register.registerMetric(activeTeamJoinRequests);
register.registerMetric(activeFriendRequests);
register.registerMetric(authRegistries);

export async function user_metrics(req: Request, res: Response, next: NextFunction) {
	try {
		const counter = await register.metrics();

		res.set('Content-Type', register.contentType);
		res
            .status(200)
            .json({
                data: counter,
            })
            .end(); // check if this is ok !!
	} catch (err) {
        console.log(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

