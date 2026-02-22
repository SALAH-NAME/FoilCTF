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

export const httpRequestDuration = new client.Histogram({
    name: "http_request_duration",
    help: "HTTP request duration in seconds",
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

register.registerMetric(teamCreations);
register.registerMetric(activeTeamJoinRequests);
register.registerMetric(activeFriendRequests);
register.registerMetric(authRegistries);

register.registerMetric(httpRequestDuration);

export async function user_metrics(req: Request, res: Response, next: NextFunction) {
	try {
		const metrics_string = await register.metrics();

		res.set('Content-Type', register.contentType);
		res.status(200).send(metrics_string);
	} catch (err) {
        console.log(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const end = httpRequestDuration.startTimer();

    res.on('finish', () => {
        end({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code : res.statusCode,
        });
    });

    next();
}
