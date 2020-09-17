// Setup the framework by tying parts of Sinuous together

// The default typing for api.h isn't good for TypeScript, but the type can't be
// overwritten by a declaration merge either, so a new h is exported and used
// instead. TS 4.0 may be able to clean this up a bit...

import { api } from 'sinuous/h';
import { subscribe, root, cleanup, sample } from 'sinuous/observable';

import type { JSXInternal } from 'sinuous/jsx';
import type { HCall } from './types/sinuous.js';

// Provide an observable implementation to Sinuous
// I didn't merge the types into sinuous/h - use sinuous/observable instead
Object.assign(api, { subscribe, cleanup, root, sample });

function h(...args: Parameters<HCall>): ReturnType<HCall> {
  return (api.h as HCall)(...args);
}
// @ts-ignore TS says `import type` doesn't work but it does
declare namespace h { export import JSX = JSXInternal; }

/** Creates SVG elements: svg(() => <path...>) */
const svg = <T extends () => Element>(closure: T): ReturnType<T> => {
  const prev = api.s;
  api.s = true;
  const el = closure();
  api.s = prev;
  return el as ReturnType<T>;
};

export { h, svg, api };
