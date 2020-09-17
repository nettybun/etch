import type { JSXInternal } from 'sinuous/jsx';
import type { ElementChildren } from 'sinuous/shared';
import type { Observable } from 'sinuous/observable';

type El = HTMLElement | SVGElement | DocumentFragment
type Component = () => El
type HCall = (
  tag: Component | Observable<unknown> | ElementChildren[] | [] | string,
  props?: (JSXInternal.HTMLAttributes | JSXInternal.SVGAttributes) & Record<string, unknown>,
  ...children: ElementChildren[]
) => El;

declare module 'sinuous/observable' {
  /** Statically declare a computation's dependencies */
  function on<T extends () => unknown>(
    observables: Observable<unknown>[],
    computed: T,
    seed: unknown,
    onchanges: boolean
  ): T
}

declare module 'sinuous/jsx' {
  namespace JSXInternal {
    interface IntrinsicAttributes { children?: never; }
    interface DOMAttributes<Target extends EventTarget> { children?: ElementChildren; }
  }
}
