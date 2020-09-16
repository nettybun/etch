// Setup the framework by tying parts of Sinuous together

// The default typing for api.h isn't good for TypeScript, but the type can't be
// overwritten by a declaration merge either, so a new h is exported and used
// instead. TS 4.0 may be able to clean this up a bit...

import { api } from 'sinuous/h';
import { subscribe, root, cleanup, sample } from 'sinuous/observable';

import type { JSXInternal } from 'sinuous/jsx';
import type { ElementChildren } from 'sinuous/shared';
import type { Observable } from 'sinuous/observable';

// Provide an observable implementation to Sinuous
// I didn't merge the types into sinuous/h - use sinuous/observable instead
Object.assign(api, { subscribe, cleanup, root, sample });

type El = HTMLElement | SVGElement | DocumentFragment
type HCall = (
  tag: () => El | Observable<unknown> | ElementChildren[] | [] | string,
  props?: (JSXInternal.HTMLAttributes | JSXInternal.SVGAttributes) & Record<string, unknown>,
  ...children: ElementChildren[]
) => El;
// Must be a function for declaration merging with namespaces
function h(...args: Parameters<HCall>): ReturnType<HCall> {
  return (api.h as HCall)(...args);
}
declare namespace h {
  // @ts-ignore TS says `import type` doesn't work but it does
  export import JSX = JSXInternal;
}
declare module 'sinuous/jsx' {
  namespace JSXInternal {
    interface IntrinsicAttributes { children?: never; }
    interface DOMAttributes<Target extends EventTarget> { children?: ElementChildren; }
  }
}

/** Creates SVG elements: svg(() => <path...>) */
const svg = <T extends () => Element>(closure: T): ReturnType<T> => {
  const prev = api.s;
  api.s = true;
  const el = closure();
  api.s = prev;
  return el as ReturnType<T>;
};

export { h, svg, api };
