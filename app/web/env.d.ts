// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly BROWSER_REST_CHALLENGES_ORIGIN: string;
	readonly BROWSER_REST_CHALLENGES_PATH: string;

	readonly BROWSER_REST_SANDBOX_ORIGIN: string;
	readonly BROWSER_REST_SANDBOX_PATH: string;

	readonly BROWSER_REST_USER_ORIGIN: string;
	readonly BROWSER_REST_EVENTS_ORIGIN: string;

	readonly BROWSER_REFRESH_INTERVAL_SECS: string;
};

interface ImportMeta {
	env: ImportMetaEnv;
}; 
