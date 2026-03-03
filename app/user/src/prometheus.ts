import prometheus from 'prom-client';

export const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

export const metric_reqs = new prometheus.Counter({
	name: 'user_http_requests_total',
	help: 'Requests processed by the user service',
	labelNames: ['status_code', 'method', 'path'],
	registers: [register],
});

export const metric_lats = new prometheus.Summary({
	name: 'user_http_requests_latency',
	help: 'Duration spent processing requests in the user service',
	registers: [register],
});
