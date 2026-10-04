

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.C73NDq-9.js","_app/immutable/chunks/CPiNGte4.js","_app/immutable/chunks/DwnE7oO9.js","_app/immutable/chunks/ClWuet9q.js"];
export const stylesheets = [];
export const fonts = [];
