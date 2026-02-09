import prometheus from 'prom-client';

export const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

export const metric_reqs = new prometheus.Counter({
	name: 'requests_total',
	help: 'Requests processed by the service',
	labelNames: ['status_code'],
	registers: [register],
});

export const metric_lats = new prometheus.Summary({
	name: 'requests_latency',
	help: 'Duration spent processing requests',
	aggregator: 'average',
	registers: [register],
});
