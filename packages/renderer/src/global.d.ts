import { AppInteractor } from "../../preload/interactors/app-interactor";
import { EntityInteractor } from "../../preload/interactors/entity-interactor";

export {};

declare global {
  interface Window {
    appInteractor: AppInteractor;
    entityInteractor: EntityInteractor;
    pdfjsWorker: any;
  }
}
