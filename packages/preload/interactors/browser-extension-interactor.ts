import { WebSocketServer } from "ws";

import { DBRepository } from "../repositories/db-repository/db-repository";
import { FileRepository } from "../repositories/file-repository/file-repository";
import { WebImporterRepository } from "../repositories/web-importer-repository/web-importer-repository";
import { WebContentType } from "../repositories/web-importer-repository/importers/importer";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";
import { EntityInteractor } from "./entity-interactor";

export class BrowserExtensionInteractor {
  sharedState: SharedState;
  preference: Preference;

  dbRepository: DBRepository;
  fileRepository: FileRepository;
  webImporterRepository: WebImporterRepository;

  entityInteractor: EntityInteractor;

  socketServer: WebSocketServer;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    dbRepository: DBRepository,
    fileRepository: FileRepository,
    webImporterRepository: WebImporterRepository,
    entityInteractor: EntityInteractor
  ) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.dbRepository = dbRepository;
    this.fileRepository = fileRepository;
    this.webImporterRepository = webImporterRepository;

    this.entityInteractor = entityInteractor;

    this.socketServer = new WebSocketServer({ port: 21992 });
    this.socketServer.on("connection", (ws) => {
      ws.on("message", this.add.bind(this));
    });
  }

  async add(webContent: string) {
    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) + 1
    );
    const entityDraft = await this.webImporterRepository.parse(
      JSON.parse(webContent) as WebContentType
    );

    if (entityDraft) {
      this.entityInteractor.scrape(JSON.stringify([entityDraft]));
    }

    this.sharedState.set(
      "viewState.processingQueueCount",
      (this.sharedState.viewState.processingQueueCount.value as number) - 1
    );
  }
}
