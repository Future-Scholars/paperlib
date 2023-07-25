export function domReady(
  condition: DocumentReadyState[] = ["complete", "interactive"]
) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

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

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function uid() {
  return Math.random().toString(36).substring(2);
}
