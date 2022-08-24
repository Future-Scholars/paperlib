import { clipboard, ipcRenderer } from "electron";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";

import { ReferenceRepository } from "../repositories/reference-repository/reference-repository";
import { EntityInteractor } from "./entity-interactor";
import { PaperEntityDraft } from "../models/PaperEntityDraft";

interface PluginRequestData {
  op: "search" | "export";
  value: string;
  args?: string;
}

export class PluginMainInteractor {
  port: MessagePort | null;

  sharedState: SharedState;
  preference: Preference;

  referenceRepository: ReferenceRepository;

  entityInteractor: EntityInteractor;

  constructor(
    sharedState: SharedState,
    preference: Preference,
    referenceRepository: ReferenceRepository,
    entityInteractor: EntityInteractor
  ) {
    this.port = null;

    this.sharedState = sharedState;
    this.preference = preference;

    this.referenceRepository = referenceRepository;
    this.entityInteractor = entityInteractor;

    this.registerPort();
  }

  registerPort() {
    ipcRenderer.on("plugin-comm-port", (event) => {
      const [port] = event.ports;
      this.port = port;

      this.port.onmessage = async (event) => {
        const data = JSON.parse(event.data) as PluginRequestData;
        switch (data.op) {
          case "search":
            await this.search(data);
            break;
          case "export":
            this.export(data);
            break;
        }
      };
    });
  }

  async search(data: PluginRequestData) {
    this.sharedState.set("viewState.searchMode", "general");
    const entities = await this.entityInteractor.loadEntities(
      data.value,
      false,
      "",
      "",
      "addTime",
      "desc"
    );
    this.port?.postMessage(entities);
  }

  async export(data: PluginRequestData) {
    let entityDrafts = JSON.parse(data.value) as PaperEntityDraft[];
    entityDrafts = entityDrafts.map((entityDraft) => {
      const draft = new PaperEntityDraft();
      draft.initialize(entityDraft);
      return draft;
    });

    let copyStr = "";
    if (data.args === "BibTex") {
      copyStr = this.referenceRepository.exportBibTexBody(
        this.referenceRepository.toCite(entityDrafts)
      );
    } else if (data.args === "BibTex-Key") {
      copyStr = this.referenceRepository.exportBibTexKey(
        this.referenceRepository.toCite(entityDrafts)
      );
    } else if (data.args === "Plain") {
      copyStr = this.referenceRepository.exportPlainText(
        this.referenceRepository.toCite(entityDrafts)
      );
    }

    clipboard.writeText(copyStr);
  }
}
