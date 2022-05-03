import { AppInteractor } from "../../preload/interactors/app-interactor";
import { EntityInteractor } from "../../preload/interactors/entity-interactor";
import { RenderInteractor } from "../../preload/interactors/render-interactor";
import { BrowserExtensionInteractor } from "../../preload/interactors/browser-extension-interactor";
export {};

declare global {
  interface Window {
    appInteractor: AppInteractor;
    entityInteractor: EntityInteractor;
    renderInteractor: RenderInteractor;
    browserExtensionInteractor: BrowserExtensionInteractor;
  }

  interface Realm {
    safeWrite: (callback: () => void) => void;
  }
}
