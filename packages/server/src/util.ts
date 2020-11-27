type Func = (...args: unknown[]) => void

function debounce<T extends Func>(
  call: T,
  ms: number,
  options: { immediate: boolean } = { immediate: false }
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null;
  function retCall(...args: Parameters<T>) {
    const later = () => {
      timeoutId = null;
      // @ts-ignore
      // eslint-disable-next-line no-invalid-this
      if (!options.immediate) call.apply(this, args);
    };
    const callNow = options.immediate && !timeoutId;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(later, ms);
    if (callNow) {
      // @ts-ignore
      // eslint-disable-next-line no-invalid-this
      call.apply(this, args);
    }
  }
  return retCall as T;
}

export { debounce };
