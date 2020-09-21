// Despite fully typing these as best as possible, they still can't be used as
// dropins for addEventListener...

type Func = (...args: unknown[]) => void

function debounce<T extends Func>(
  call: T,
  ms: number,
  options: { immediate: boolean } = { immediate: false }
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null;
  return function(...args) {
    const later = () => {
      timeoutId = null;
      // eslint-disable-next-line no-invalid-this
      if (!options.immediate) call.apply(this, args);
    };
    const callNow = options.immediate && !timeoutId;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(later, ms);
    if (callNow) {
      // eslint-disable-next-line no-invalid-this
      call.apply(this, args);
    }
  };
}

function throttle<T extends Func>(
  call: Func,
  interval: number
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
  let enabled = true;
  return function(...args) {
    if (!enabled) {
      return;
    }
    enabled = false;
    // eslint-disable-next-line no-invalid-this
    call.apply(this, args);
    setTimeout(() => {
      enabled = true;
    }, interval);
  };
}

export { debounce, throttle };
