// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_REST_CHALLENGES_ORIGIN: string;
	readonly VITE_REST_CHALLENGES_PATH: string;

	readonly VITE_REST_SANDBOX_ORIGIN: string;
	readonly VITE_REST_SANDBOX_PATH: string;

	readonly VITE_REFRESH_INTERVAL_SECS: string;
	readonly VITE_REST_USER_ORIGIN: string;
};

interface ImportMeta {
	env: ImportMetaEnv;
}; 
