import { a3 as escape_html, a4 as getContext, W as noop } from '../../chunks/index.js-j6664L0K.js';
import '../../chunks/exports.js-8HOoaa4e.js';
import '../../chunks/utils.js-DBwpgn00.js';
import '../../chunks/root.js-CIZ0sLmn.js';
import '../../chunks/utils2.js-BQzn9ikS.js';

const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
const placeholder_url = "a:";
if (is_legacy) {
  ({
    url: new URL(placeholder_url)
  });
}
function context() {
  return getContext("__request__");
}
const page$1 = {
  get error() {
    return context().page.error;
  },
  get status() {
    return context().page.status;
  }
};
const page = page$1;
function Error$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
  });
}

export { Error$1 as default };
//# sourceMappingURL=error.svelte.js-D0IYRK72.js.map
