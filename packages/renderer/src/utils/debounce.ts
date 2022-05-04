export function debounce(fn: Function, delay: number) {
  var timeoutID: NodeJS.Timeout;
  return () => {
    clearTimeout(timeoutID);
    var args = arguments;
    // @ts-ignore
    var that = this;
    timeoutID = setTimeout(function () {
      fn.apply(that, args);
    }, delay);
  };
}
