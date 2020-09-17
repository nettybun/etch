import 'sinuous/observable';

declare module 'sinuous/observable' {
  /** Statically declare a computation's dependencies */
  function on<T extends () => unknown>(
    observables: Observable<unknown>[],
    computed: T,
    seed: unknown,
    onchanges: boolean
  ): T
}
