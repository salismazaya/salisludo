
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const BROWSERBASE_PROXIES: string;
	export const _HERMES_GATEWAY: string;
	export const HERMES_SESSION_KEY: string;
	export const AI_AGENT: string;
	export const LANGUAGE: string;
	export const USER: string;
	export const HEADROOM_TELEMETRY: string;
	export const LC_TIME: string;
	export const npm_config_user_agent: string;
	export const TERMINAL_CONTAINER_CPU: string;
	export const HERMES_SUPERVISED_CHILD: string;
	export const XDG_SEAT: string;
	export const HERMES_SESSION_USER_NAME: string;
	export const TERMINAL_DOCKER_ENV: string;
	export const XAUTHLOCALHOSTNAME: string;
	export const TERMINAL_CWD: string;
	export const TEXTDOMAIN: string;
	export const HERMES_REAL_HOME: string;
	export const XDG_SESSION_TYPE: string;
	export const npm_node_execpath: string;
	export const XDG_CACHE_HOME: string;
	export const SHLVL: string;
	export const HERMES_SESSION_CHAT_TYPE: string;
	export const npm_config_noproxy: string;
	export const OPENAI_BASE_URL: string;
	export const HOME: string;
	export const HERMES_UI_SESSION_ID: string;
	export const OLDPWD: string;
	export const TERMINAL_DOCKER_FORWARD_ENV: string;
	export const DESKTOP_SESSION: string;
	export const BROWSER_SESSION_TIMEOUT: string;
	export const LIBGL_DRI3_DISABLE: string;
	export const HERMES_HOME: string;
	export const npm_package_json: string;
	export const TERMINAL_DOCKER_EXTRA_ARGS: string;
	export const TELEGRAM_REQUIRE_MENTION: string;
	export const IM_CONFIG_ENTRY: string;
	export const TERMINAL_DOCKER_IMAGE: string;
	export const HERMES_EXEC_ASK: string;
	export const GTK_MODULES: string;
	export const XDG_SEAT_PATH: string;
	export const PAGER: string;
	export const TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE: string;
	export const TERMINAL_CONTAINER_MEMORY: string;
	export const LC_MONETARY: string;
	export const MANAGERPID: string;
	export const SSL_CERT_FILE: string;
	export const TERMINAL_CONTAINER_PERSISTENT: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const HEADROOM_HOST: string;
	export const HERMES_SESSION_USER_ID: string;
	export const SYSTEMD_EXEC_PID: string;
	export const COPILOT_PROVIDER_TYPE: string;
	export const HERMES_TURN_LEASE_TIMEOUT: string;
	export const HERMES_SESSION_CHAT_NAME: string;
	export const HERMES_MEDIA_DELIVERY_STRICT: string;
	export const TERMINAL_MODAL_IMAGE: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const TERMINAL_DOCKER_NETWORK: string;
	export const MCP_2CAPTCHA_API_KEY: string;
	export const COLOR: string;
	export const DEBUGINFOD_URLS: string;
	export const TERMINAL_DOCKER_VOLUMES: string;
	export const TERMINAL_ENV: string;
	export const MANDATORY_PATH: string;
	export const HERMES_SESSION_MESSAGE_ID: string;
	export const TERMINAL_VERCEL_RUNTIME: string;
	export const LOGNAME: string;
	export const HERMES_SESSION_THREAD_ID: string;
	export const IMAGE_TOOLS_DEBUG: string;
	export const MANAGERPIDFDID: string;
	export const ENABLE_TOOL_SEARCH: string;
	export const JOURNAL_STREAM: string;
	export const _: string;
	export const npm_config_prefix: string;
	export const npm_config_npm_version: string;
	export const group_sessions_per_user: string;
	export const MEMORY_PRESSURE_WATCH: string;
	export const XDG_SESSION_CLASS: string;
	export const DEFAULTS_PATH: string;
	export const API_SERVER_CORS_ORIGINS: string;
	export const BROWSERBASE_ADVANCED_STEALTH: string;
	export const ANTHROPIC_BASE_URL: string;
	export const HEADROOM_PORT: string;
	export const TERMINAL_DAYTONA_IMAGE: string;
	export const XDG_SESSION_ID: string;
	export const npm_config_cache: string;
	export const HERMES_SESSION_USER_ID_ALT: string;
	export const HERMES_SESSION_CHAT_ID: string;
	export const TERMINAL_TEMP_DIR: string;
	export const TERMINAL_LIFETIME_SECONDS: string;
	export const TERMINAL_TIMEOUT: string;
	export const HERMES_GATEWAY_BUSY_INPUT_MODE: string;
	export const TERMINAL_DOCKER_SHARED_CONTAINER_KEY: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const GDM_LANG: string;
	export const INVOCATION_ID: string;
	export const GTK3_MODULES: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const XDG_SESSION_PATH: string;
	export const XDG_MENU_PREFIX: string;
	export const LC_ADDRESS: string;
	export const TERMINAL_DOCKER_SHM_SIZE: string;
	export const XDG_RUNTIME_DIR: string;
	export const DISPLAY: string;
	export const TERMINAL_PERSISTENT_SHELL: string;
	export const TELEGRAM_EXCLUSIVE_BOT_MENTIONS: string;
	export const LANG: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const HERMES_QUIET: string;
	export const LC_TELEPHONE: string;
	export const HERMES_SESSION_PROFILE: string;
	export const MOA_TOOLS_DEBUG: string;
	export const HERMES_MEDIA_TRUST_RECENT_FILES: string;
	export const HEADROOM_MODE: string;
	export const XDG_CONFIG_HOME: string;
	export const XDG_SESSION_DESKTOP: string;
	export const HEADROOM_BACKEND: string;
	export const XAUTHORITY: string;
	export const HERMES_MAX_ITERATIONS: string;
	export const npm_lifecycle_script: string;
	export const SSH_AUTH_SOCK: string;
	export const XDG_GREETER_DATA_DIR: string;
	export const HERMES_SESSION_ID: string;
	export const HERMES_SESSION_PARENT_CHAT_ID: string;
	export const SHELL: string;
	export const LC_NAME: string;
	export const TERMINAL_DEGRADED_MODE: string;
	export const TERMINAL_MODAL_MODE: string;
	export const MCP_SALISMCP_API_KEY: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const QT_ACCESSIBILITY: string;
	export const GDMSESSION: string;
	export const WEB_TOOLS_DEBUG: string;
	export const VISION_TOOLS_DEBUG: string;
	export const HERMES_BROWSER_CONTROL_PRINCIPAL: string;
	export const HERMES_SESSION_PLATFORM: string;
	export const LC_MEASUREMENT: string;
	export const HERMES_STARTUP_WATCHDOG_TIMEOUT_S: string;
	export const TEXTDOMAINDIR: string;
	export const GPG_AGENT_INFO: string;
	export const TERMINAL_CONTAINER_DISK: string;
	export const LC_IDENTIFICATION: string;
	export const HERMES_SESSION_SCOPE_ID: string;
	export const TERMINAL_DOCKER_RUN_AS_HOST_USER: string;
	export const HERMES_BROWSER_CONTROL_TRANSPORT_FAMILY: string;
	export const GIT_PAGER: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const PWD: string;
	export const _config_version: string;
	export const npm_execpath: string;
	export const XDG_CONFIG_DIRS: string;
	export const TELEGRAM_HOME_CHANNEL_THREAD_ID: string;
	export const XDG_DATA_DIRS: string;
	export const npm_config_global_prefix: string;
	export const HERMES_CRON_SESSION: string;
	export const LC_NUMERIC: string;
	export const npm_config_allow_scripts: string;
	export const npm_command: string;
	export const LC_PAPER: string;
	export const BROWSER_INACTIVITY_TIMEOUT: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const COPILOT_PROVIDER_BASE_URL: string;
	export const TERMINAL_SINGULARITY_IMAGE: string;
	export const TERMINAL_HOME_MODE: string;
	export const TERMINAL_DOCKER_SNAP_COMPAT: string;
	export const HERMES_AGENT: string;
	export const HERMES_SESSION_SOURCE: string;
	export const INIT_CWD: string;
	export const EDITOR: string;
	export const TEST: string;
	export const VITEST: string;
	export const NODE_ENV: string;
	export const PROD: string;
	export const DEV: string;
	export const BASE_URL: string;
	export const MODE: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		BROWSERBASE_PROXIES: string;
		_HERMES_GATEWAY: string;
		HERMES_SESSION_KEY: string;
		AI_AGENT: string;
		LANGUAGE: string;
		USER: string;
		HEADROOM_TELEMETRY: string;
		LC_TIME: string;
		npm_config_user_agent: string;
		TERMINAL_CONTAINER_CPU: string;
		HERMES_SUPERVISED_CHILD: string;
		XDG_SEAT: string;
		HERMES_SESSION_USER_NAME: string;
		TERMINAL_DOCKER_ENV: string;
		XAUTHLOCALHOSTNAME: string;
		TERMINAL_CWD: string;
		TEXTDOMAIN: string;
		HERMES_REAL_HOME: string;
		XDG_SESSION_TYPE: string;
		npm_node_execpath: string;
		XDG_CACHE_HOME: string;
		SHLVL: string;
		HERMES_SESSION_CHAT_TYPE: string;
		npm_config_noproxy: string;
		OPENAI_BASE_URL: string;
		HOME: string;
		HERMES_UI_SESSION_ID: string;
		OLDPWD: string;
		TERMINAL_DOCKER_FORWARD_ENV: string;
		DESKTOP_SESSION: string;
		BROWSER_SESSION_TIMEOUT: string;
		LIBGL_DRI3_DISABLE: string;
		HERMES_HOME: string;
		npm_package_json: string;
		TERMINAL_DOCKER_EXTRA_ARGS: string;
		TELEGRAM_REQUIRE_MENTION: string;
		IM_CONFIG_ENTRY: string;
		TERMINAL_DOCKER_IMAGE: string;
		HERMES_EXEC_ASK: string;
		GTK_MODULES: string;
		XDG_SEAT_PATH: string;
		PAGER: string;
		TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE: string;
		TERMINAL_CONTAINER_MEMORY: string;
		LC_MONETARY: string;
		MANAGERPID: string;
		SSL_CERT_FILE: string;
		TERMINAL_CONTAINER_PERSISTENT: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		HEADROOM_HOST: string;
		HERMES_SESSION_USER_ID: string;
		SYSTEMD_EXEC_PID: string;
		COPILOT_PROVIDER_TYPE: string;
		HERMES_TURN_LEASE_TIMEOUT: string;
		HERMES_SESSION_CHAT_NAME: string;
		HERMES_MEDIA_DELIVERY_STRICT: string;
		TERMINAL_MODAL_IMAGE: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		TERMINAL_DOCKER_NETWORK: string;
		MCP_2CAPTCHA_API_KEY: string;
		COLOR: string;
		DEBUGINFOD_URLS: string;
		TERMINAL_DOCKER_VOLUMES: string;
		TERMINAL_ENV: string;
		MANDATORY_PATH: string;
		HERMES_SESSION_MESSAGE_ID: string;
		TERMINAL_VERCEL_RUNTIME: string;
		LOGNAME: string;
		HERMES_SESSION_THREAD_ID: string;
		IMAGE_TOOLS_DEBUG: string;
		MANAGERPIDFDID: string;
		ENABLE_TOOL_SEARCH: string;
		JOURNAL_STREAM: string;
		_: string;
		npm_config_prefix: string;
		npm_config_npm_version: string;
		group_sessions_per_user: string;
		MEMORY_PRESSURE_WATCH: string;
		XDG_SESSION_CLASS: string;
		DEFAULTS_PATH: string;
		API_SERVER_CORS_ORIGINS: string;
		BROWSERBASE_ADVANCED_STEALTH: string;
		ANTHROPIC_BASE_URL: string;
		HEADROOM_PORT: string;
		TERMINAL_DAYTONA_IMAGE: string;
		XDG_SESSION_ID: string;
		npm_config_cache: string;
		HERMES_SESSION_USER_ID_ALT: string;
		HERMES_SESSION_CHAT_ID: string;
		TERMINAL_TEMP_DIR: string;
		TERMINAL_LIFETIME_SECONDS: string;
		TERMINAL_TIMEOUT: string;
		HERMES_GATEWAY_BUSY_INPUT_MODE: string;
		TERMINAL_DOCKER_SHARED_CONTAINER_KEY: string;
		npm_config_node_gyp: string;
		PATH: string;
		GDM_LANG: string;
		INVOCATION_ID: string;
		GTK3_MODULES: string;
		NODE: string;
		npm_package_name: string;
		XDG_SESSION_PATH: string;
		XDG_MENU_PREFIX: string;
		LC_ADDRESS: string;
		TERMINAL_DOCKER_SHM_SIZE: string;
		XDG_RUNTIME_DIR: string;
		DISPLAY: string;
		TERMINAL_PERSISTENT_SHELL: string;
		TELEGRAM_EXCLUSIVE_BOT_MENTIONS: string;
		LANG: string;
		XDG_CURRENT_DESKTOP: string;
		HERMES_QUIET: string;
		LC_TELEPHONE: string;
		HERMES_SESSION_PROFILE: string;
		MOA_TOOLS_DEBUG: string;
		HERMES_MEDIA_TRUST_RECENT_FILES: string;
		HEADROOM_MODE: string;
		XDG_CONFIG_HOME: string;
		XDG_SESSION_DESKTOP: string;
		HEADROOM_BACKEND: string;
		XAUTHORITY: string;
		HERMES_MAX_ITERATIONS: string;
		npm_lifecycle_script: string;
		SSH_AUTH_SOCK: string;
		XDG_GREETER_DATA_DIR: string;
		HERMES_SESSION_ID: string;
		HERMES_SESSION_PARENT_CHAT_ID: string;
		SHELL: string;
		LC_NAME: string;
		TERMINAL_DEGRADED_MODE: string;
		TERMINAL_MODAL_MODE: string;
		MCP_SALISMCP_API_KEY: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		QT_ACCESSIBILITY: string;
		GDMSESSION: string;
		WEB_TOOLS_DEBUG: string;
		VISION_TOOLS_DEBUG: string;
		HERMES_BROWSER_CONTROL_PRINCIPAL: string;
		HERMES_SESSION_PLATFORM: string;
		LC_MEASUREMENT: string;
		HERMES_STARTUP_WATCHDOG_TIMEOUT_S: string;
		TEXTDOMAINDIR: string;
		GPG_AGENT_INFO: string;
		TERMINAL_CONTAINER_DISK: string;
		LC_IDENTIFICATION: string;
		HERMES_SESSION_SCOPE_ID: string;
		TERMINAL_DOCKER_RUN_AS_HOST_USER: string;
		HERMES_BROWSER_CONTROL_TRANSPORT_FAMILY: string;
		GIT_PAGER: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		PWD: string;
		_config_version: string;
		npm_execpath: string;
		XDG_CONFIG_DIRS: string;
		TELEGRAM_HOME_CHANNEL_THREAD_ID: string;
		XDG_DATA_DIRS: string;
		npm_config_global_prefix: string;
		HERMES_CRON_SESSION: string;
		LC_NUMERIC: string;
		npm_config_allow_scripts: string;
		npm_command: string;
		LC_PAPER: string;
		BROWSER_INACTIVITY_TIMEOUT: string;
		MEMORY_PRESSURE_WRITE: string;
		COPILOT_PROVIDER_BASE_URL: string;
		TERMINAL_SINGULARITY_IMAGE: string;
		TERMINAL_HOME_MODE: string;
		TERMINAL_DOCKER_SNAP_COMPAT: string;
		HERMES_AGENT: string;
		HERMES_SESSION_SOURCE: string;
		INIT_CWD: string;
		EDITOR: string;
		TEST: string;
		VITEST: string;
		NODE_ENV: string;
		PROD: string;
		DEV: string;
		BASE_URL: string;
		MODE: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
