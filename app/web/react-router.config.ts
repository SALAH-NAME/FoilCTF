import type { Config } from '@react-router/dev/config';

export default {
	ssr: true,
	allowedActionOrigins: ["localhost:3443"]
} satisfies Config;
