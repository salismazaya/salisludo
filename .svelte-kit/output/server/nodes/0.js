

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BjWBYFKd.js","_app/immutable/chunks/BEat11JH.js","_app/immutable/chunks/BxwkjSOn.js","_app/immutable/chunks/B1EL4iFu.js"];
export const stylesheets = [];
export const fonts = [];
