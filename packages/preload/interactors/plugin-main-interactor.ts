import { clipboard, ipcRenderer } from "electron";

import { SharedState } from "../utils/appstate";
import { Preference } from "../utils/preference";

import { ReferenceRepository } from "../repositories/reference-repository/reference-repository";
import { EntityInteractor } from "./entity-interactor";
import { PaperEntityDraft } from "../models/PaperEntityDraft";

interface PluginRequestData {
  op:
    | "search"
    | "export"
    | "folder-list"
    | "plugin-link-folder"
    | "linked-folder"
    | "plugin-unlink-folder";
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
          case "folder-list":
            this.getFolderList(data);
            break;
          case "plugin-link-folder":
            this.pluginLinkFolder(data.value);
            break;
          case "linked-folder":
            this.getLinkedFolder();
            break;
          case "plugin-unlink-folder":
            this.pluginUnlinkFolder();
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
    this.port?.postMessage({ type: "search-result", value: entities });
  }

  async export(data: PluginRequestData) {
    let entityDrafts = JSON.parse(data.value) as PaperEntityDraft[];
    const pluginLinkedFolder = this.sharedState.get(
      "selectionState.pluginLinkedFolder"
    ).value as string;

    if (entityDrafts.length > 0) {
      entityDrafts = entityDrafts
        .filter((entityDraft) => entityDraft !== null)
        .map((entityDraft) => {
          const draft = new PaperEntityDraft();
          draft.initialize(entityDraft);
          return draft;
        });
    }

    if (pluginLinkedFolder !== "") {
      if (entityDrafts.length > 0) {
        this.entityInteractor.updateWithCategorizer(
          entityDrafts.map((draft) => {
            return `${draft.id}`;
          }),
          pluginLinkedFolder,
          "PaperFolder"
        );
      }
    }

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
    } else if (data.args === "BibTex-In-Folder") {
      if (
        (this.sharedState.get("selectionState.pluginLinkedFolder")
          .value as string) !== ""
      ) {
        const entities = await this.entityInteractor.loadEntities(
          "",
          false,
          "",
          pluginLinkedFolder,
          "addTime",
          "desc"
        );
        entityDrafts = entities.map((entity) => {
          const draft = new PaperEntityDraft();
          draft.initialize(entity);
          return draft;
        });
        copyStr = this.referenceRepository.exportBibTexBody(
          this.referenceRepository.toCite(entityDrafts)
        );
      }
    }

    clipboard.writeText(copyStr);
  }

  async getFolderList(data: PluginRequestData) {
    const folders = await this.entityInteractor.loadCategorizers(
      "PaperFolder",
      "name",
      "desc"
    );
    this.port?.postMessage({ type: "folder-list-result", value: folders });
  }

  // ============================================================

  pluginLinkFolder(folderName: string) {
    if (folderName === "paperlib-link-new-folder") {
    } else {
      this.preference.set("pluginLinkedFolder", folderName);
      this.sharedState.set("selectionState.pluginLinkedFolder", folderName);
      this.port?.postMessage({
        type: "linked-folder-changed",
        value: folderName,
      });
    }
  }

  pluginUnlinkFolder() {
    this.preference.set("pluginLinkedFolder", "");
    this.sharedState.set("selectionState.pluginLinkedFolder", "");
  }

  getLinkedFolder() {
    this.port?.postMessage({
      type: "linked-folder-result",
      value: this.preference.get("pluginLinkedFolder"),
    });
  }
}
