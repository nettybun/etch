import { api } from 'sinuous/h';
import { subscribe, root, cleanup, sample } from 'sinuous/observable';

import type { JSXInternal } from 'sinuous/jsx';
import type { ElementChildren } from 'sinuous/shared';
import type { Observable } from 'sinuous/observable';

// Sinuous requires an observable implementation
Object.assign(api, { subscribe, cleanup, root, sample });

// @ts-expect-error Not allowed to use `import type` but still works
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace h { export import JSX = JSXInternal; }
// Must be a function for declaration merging
function h(...args: Parameters<HCall>): ReturnType<HCall> { return (api.h as HCall)(...args); }

/** Set h() to temporarily build SVG elements for the duration of the closure */
const svg = <T extends () => Element>(closure: T): ReturnType<T> => {
  const prev = api.s;
  api.s = true;
  const el = closure();
  api.s = prev;
  return el as ReturnType<T>;
};

// Declarations and typings
// Thankfully these are hoisted so they don't need to take up space

declare module 'sinuous/jsx' {
  // Disallow children on components that don't declare them explicitly
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSXInternal {
    interface IntrinsicAttributes {
      children?: never;
    }
    interface DOMAttributes<Target extends EventTarget> {
      children?: ElementChildren;
    }
  }
}

// XXX: SSR support
declare global {
  interface Window {
    hydrating?: boolean;
  }
}

type El = HTMLElement | SVGElement | DocumentFragment
type Component = () => El
// This isn't the real definition but sinuous/h uses overloads and Typescript is
// fragile about `...args` and return types on functions that have overloads
type HCall = (
  tag: Component | Observable<unknown> | ElementChildren[] | [] | string,
  props?: (JSXInternal.HTMLAttributes | JSXInternal.SVGAttributes) & Record<string, unknown>,
  ...children: ElementChildren[]
) => El;

declare module 'sinuous/h' {
  interface HyperscriptApi {
    // Throws "Subsequent declarations must have the same type" else it would
    // make sense to remove overloads on the definition as explained above

    // h: typeof h
    subscribe: typeof subscribe;
    cleanup: typeof cleanup;
    root: typeof root;
    sample: typeof sample;
  }
}

export { HCall as HyperscriptCall }; // Types
export { h, svg, api };
