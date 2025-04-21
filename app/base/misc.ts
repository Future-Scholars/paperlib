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
  const randomPart = Math.random().toString(36);
  const timestampPart = Date.now().toString(36);
  return randomPart.slice(randomPart.length - 4) + timestampPart.slice(timestampPart.length - 4);
}
