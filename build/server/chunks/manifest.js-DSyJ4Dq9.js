const manifest = (() => {
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
		client: {start:"_app/immutable/entry/start.BYS4-1UK.js",app:"_app/immutable/entry/app.DrrYFpye.js",imports:["_app/immutable/entry/start.BYS4-1UK.js","_app/immutable/chunks/BxwkjSOn.js","_app/immutable/chunks/Pk5OWP6x.js","_app/immutable/chunks/C6BsZ9W2.js","_app/immutable/entry/app.DrrYFpye.js","_app/immutable/chunks/BxwkjSOn.js","_app/immutable/chunks/DbokLMoD.js","_app/immutable/chunks/BEat11JH.js","_app/immutable/chunks/C6BsZ9W2.js","_app/immutable/chunks/oSDZjf7l.js","_app/immutable/chunks/B1EL4iFu.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js-BoMGfj7Z.js')),
			__memo(() => import('./nodes/1.js-B6ocg7_g.js')),
			__memo(() => import('./nodes/2.js-DSAr7PJd.js'))
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

export { manifest as m };
//# sourceMappingURL=manifest.js-DSyJ4Dq9.js.map
