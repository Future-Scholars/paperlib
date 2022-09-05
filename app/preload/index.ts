import { appendLoading } from "./loading";
import { domReady, createInteractorProxy } from "../utils/misc";
// import { MainRendererStateStore } from "@/state/renderer/appstate";
// import { DBRepository } from "@/repositories/db-repository/db-repository";
// import { EntityInteractor } from "@/interactors/entity-interactor";
// import { Preference } from "@/preference/preference";
// import { AppInteractor } from "@/interactors/app-interactor";
// import { contextBridge } from "electron";
// import { PreloadStateStore } from "@/state/preload/appstate";

domReady().then(appendLoading);

// // ====================================
// // Setup interactors and repositories
// // ====================================
// const preference = new Preference();
// const stateStore = new PreloadStateStore(preference);
// const dbRepository = new DBRepository(stateStore);

// const entityInteractor = new EntityInteractor(stateStore, dbRepository);
// const appInteractor = new AppInteractor(preference);

// const entityInteractorProxy = createInteractorProxy(entityInteractor);
// const appInteractorProxy = createInteractorProxy(appInteractor);

// contextBridge.exposeInMainWorld("entityInteractor", entityInteractorProxy);
// contextBridge.exposeInMainWorld("appInteractor", appInteractorProxy);

// ====================================
// Inject
// ====================================
// window.entityInteractor = entityInteractor;
// window.appInteractor = appInteractor;
