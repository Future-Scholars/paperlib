import { AppInteractor } from "../interactors/app-interactor";
import { BrowserExtensionInteractor } from "../interactors/browser-extension-interactor";
import { EntityInteractor } from "../interactors/entity-interactor";
import { RenderInteractor } from "../interactors/render-interactor";
import { FeedInteractor } from "../interactors/feed-interactor";
import { PluginSideInteractor } from "../interactors/plugin-side-interactor";
import { PluginMainInteractor } from "../interactors/plugin-main-interactor";

export function createInteractorProxy(
  interactor:
    | AppInteractor
    | EntityInteractor
    | RenderInteractor
    | BrowserExtensionInteractor
    | PluginSideInteractor
    | PluginMainInteractor
    | FeedInteractor
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
