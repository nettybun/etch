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

export { debounce };
