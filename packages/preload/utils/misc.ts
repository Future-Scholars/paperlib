import { AppInteractor } from "../interactors/app-interactor";
import { EntityInteractor } from "../interactors/entity-interactor";

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
