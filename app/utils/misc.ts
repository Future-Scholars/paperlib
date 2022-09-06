import { EntityInteractor } from "@/interactors/entity-interactor";
import { AppInteractor } from "@/interactors/app-interactor";

export function createInteractorProxy(
  interactor: AppInteractor | EntityInteractor
) {
  const interactorFuncs = Object.getOwnPropertyNames(
    Object.getPrototypeOf(interactor)
  );
  const interactorProps = Object.getOwnPropertyNames(interactor);

  const interactorProxy = {};
  for (let func of interactorFuncs) {
    if (func === "constructor") {
      continue;
    }
    // @ts-ignore
    interactorProxy[func] = interactor[func].bind(interactor);
  }

  for (let prop of interactorProps) {
    if (prop === "constructor") {
      continue;
    }
    // @ts-ignore
    interactorProxy[prop] = interactor[prop];
  }

  return interactorProxy;
}

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
