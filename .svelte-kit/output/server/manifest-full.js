export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BoP0eFIj.js",app:"_app/immutable/entry/app.CENQhv0i.js",imports:["_app/immutable/entry/start.BoP0eFIj.js","_app/immutable/chunks/DwnE7oO9.js","_app/immutable/chunks/BqcCV4UG.js","_app/immutable/chunks/D5MSBHM5.js","_app/immutable/entry/app.CENQhv0i.js","_app/immutable/chunks/DwnE7oO9.js","_app/immutable/chunks/Dj8Cmx2r.js","_app/immutable/chunks/CPiNGte4.js","_app/immutable/chunks/D5MSBHM5.js","_app/immutable/chunks/CuWa4Znu.js","_app/immutable/chunks/ClWuet9q.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
