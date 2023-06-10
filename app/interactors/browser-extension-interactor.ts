import * as WebSocket from "ws";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { WebContentType } from "@/repositories/web-importer-repository/importers/importer";
import { WebImporterRepository } from "@/repositories/web-importer-repository/web-importer-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { EntityInteractor } from "./entity-interactor";

export class BrowserExtensionInteractor {
  stateStore: MainRendererStateStore;
  preference: Preference;

  webImporterRepository: WebImporterRepository;

  entityInteractor: EntityInteractor;

  socketServer: WebSocket.WebSocketServer;
  ws?: WebSocket.WebSocket;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    webImporterRepository: WebImporterRepository,
    entityInteractor: EntityInteractor
  ) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.webImporterRepository = webImporterRepository;

    this.entityInteractor = entityInteractor;

    this.socketServer = new WebSocket.WebSocketServer({ port: 21992 });
    this.socketServer.on("connection", (ws) => {
      this.ws = ws;
      ws.on("message", this.create.bind(this));
    });
  }

  async create(webContent: string) {
    this.stateStore.viewState.processingQueueCount += 1;

    const entityDraft = await this.webImporterRepository.parse(
      JSON.parse(webContent) as WebContentType
    );

    if (entityDraft) {
      await this.entityInteractor.scrape([entityDraft as PaperEntity]);
      this.ws?.send(JSON.stringify({ response: "successful" }));
    } else {
      this.ws?.send(JSON.stringify({ response: "no-avaliable-importer" }));
    }

    this.stateStore.viewState.processingQueueCount -= 1;
  }
}
