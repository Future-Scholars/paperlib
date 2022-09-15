import { clipboard, ipcRenderer } from "electron";

import { PaperFolder } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { ReferenceRepository } from "@/repositories/reference-repository/reference-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

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

  stateStore: MainRendererStateStore;
  preference: Preference;

  referenceRepository: ReferenceRepository;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    referenceRepository: ReferenceRepository
  ) {
    this.port = null;

    this.stateStore = stateStore;
    this.preference = preference;

    this.referenceRepository = referenceRepository;

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
    this.stateStore.viewState.searchMode = "general";
    const entities = await window.entityInteractor.loadPaperEntities(
      data.value,
      false,
      "",
      "",
      "addTime",
      "desc"
    );

    let results = [];
    let i = 0;
    for (const paperEntity of entities) {
      i++;
      if (i === 10) {
        break;
      }
      results.push(new PaperEntity(false).initialize(paperEntity));
    }

    this.port?.postMessage({
      type: "search-result",
      value: JSON.stringify(results),
    });
  }

  async export(data: PluginRequestData) {
    let paperEntityDrafts = JSON.parse(data.value) as PaperEntity[];
    const pluginLinkedFolder =
      this.stateStore.selectionState.pluginLinkedFolder;

    if (paperEntityDrafts.length > 0) {
      paperEntityDrafts = paperEntityDrafts
        .filter((entityDraft) => entityDraft !== null)
        .map((entityDraft) => {
          const draft = new PaperEntity(false).initialize(entityDraft);
          return draft;
        });
    }

    if (pluginLinkedFolder !== "") {
      if (paperEntityDrafts.length > 0) {
        window.entityInteractor.updateWithCategorizer(
          paperEntityDrafts.map((draft) => {
            return `${draft.id}`;
          }),
          new PaperFolder(pluginLinkedFolder, 1),
          "PaperFolder"
        );
      }
    }

    let copyStr = "";
    if (data.args === "BibTex") {
      copyStr = this.referenceRepository.exportBibTexBody(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    } else if (data.args === "BibTex-Key") {
      copyStr = this.referenceRepository.exportBibTexKey(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    } else if (data.args === "PlainText") {
      copyStr = await this.referenceRepository.exportPlainText(
        this.referenceRepository.toCite(paperEntityDrafts)
      );
    } else if (data.args?.endsWith("In-Folder")) {
      if (this.stateStore.selectionState.pluginLinkedFolder !== "") {
        const entities = await window.entityInteractor.loadPaperEntities(
          "",
          false,
          "",
          pluginLinkedFolder,
          "addTime",
          "desc"
        );
        paperEntityDrafts = entities.map((entity) => {
          return new PaperEntity(false).initialize(entity);
        });

        if (data.args === "BibTex-In-Folder") {
          copyStr = this.referenceRepository.exportBibTexBody(
            this.referenceRepository.toCite(paperEntityDrafts)
          );
        } else if (data.args === "PlainText-In-Folder") {
          copyStr = await this.referenceRepository.exportPlainText(
            this.referenceRepository.toCite(paperEntityDrafts)
          );
        }
      }
    }
    clipboard.writeText(copyStr);
  }

  async getFolderList(data: PluginRequestData) {
    const folders = await window.entityInteractor.loadCategorizers(
      "PaperFolder",
      "name",
      "desc"
    );
    this.port?.postMessage({
      type: "folder-list-result",
      value: folders.toJSON(),
    });
  }

  // ============================================================

  pluginLinkFolder(folderName: string) {
    this.preference.set("pluginLinkedFolder", folderName);
    this.stateStore.selectionState.pluginLinkedFolder = folderName;
    this.port?.postMessage({
      type: "linked-folder-changed",
      value: folderName,
    });
  }

  pluginUnlinkFolder() {
    this.preference.set("pluginLinkedFolder", "");
    this.stateStore.selectionState.pluginLinkedFolder = "";
  }

  getLinkedFolder() {
    this.port?.postMessage({
      type: "linked-folder-result",
      value: this.preference.get("pluginLinkedFolder"),
    });
  }
}
