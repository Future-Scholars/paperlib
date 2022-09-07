import { Categorizer, CategorizerType, Colors } from "@/models/categorizer";
import { DBRepository } from "@/repositories/db-repository/db-repository";
import { PaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export class EntityInteractor {
  stateStore: MainRendererStateStore;

  dbRepository: DBRepository;

  constructor(stateStore: MainRendererStateStore, dbRepository: DBRepository) {
    this.stateStore = stateStore;
    this.dbRepository = dbRepository;
  }

  // ========================
  // Read
  // ========================

  async loadPaperEntities(
    search: string,
    flag: boolean,
    tag: string,
    folder: string,
    sortBy: string,
    sortOrder: string
  ) {
    let entities;
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      entities = await this.dbRepository.paperEntities(
        search,
        flag,
        tag,
        folder,
        sortBy,
        sortOrder
      );
    } catch (e) {
      console.error(e);
      entities = [] as PaperEntityResults;
    }
    // TODO: implement this
    // if (this.sharedState.viewState.searchMode.get() === "fulltext" && search) {
    //   entities = await this.cacheRepository.fullTextFilter(search, entities);
    // }
    this.stateStore.viewState.processingQueueCount -= 1;
    return entities;
  }

  async loadCategorizers(
    type: CategorizerType,
    sortBy: string,
    sortOrder: string
  ) {
    return await this.dbRepository.categorizers(type, sortBy, sortOrder);
  }

  // ========================
  // Remove
  // ========================
  removeCategorizer(
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    this.stateStore.viewState.processingQueueCount += 1;
    try {
      void this.dbRepository.removeCategorizer(true, type, categorizer, name);
    } catch (e) {
      console.error(e);
      this.stateStore.logState.alertLog = `Failed to remove categorizer ${type} ${name} ${categorizer}`;
    }
    this.stateStore.viewState.processingQueueCount -= 1;
  }

  // ========================
  // Update
  // ========================
  colorizeCategorizers(
    color: Colors,
    type: CategorizerType,
    name?: string,
    categorizer?: Categorizer
  ) {
    void this.dbRepository.colorizeCategorizer(color, type, categorizer, name);
  }

  async renameCategorizer(
    oldName: string,
    newName: string,
    type: CategorizerType
  ) {
    const success = await this.dbRepository.renameCategorizer(
      oldName,
      newName,
      type
    );

    // TODO: uncomment this
    // if (
    //   categorizerType === "PaperFolder" &&
    //   this.stateStore.selectionState.pluginLinkedFolder.value ===
    //     oldCategorizerName &&
    //   success
    // ) {
    //   this.stateStore.selectionState.pluginLinkedFolder.value =
    //     newCategorizerName;
    //   this.preference.set("pluginLinkedFolder", newCategorizerName);
    // }
  }

  // ========================
  // Dev Functions
  // ========================
  async addDummyData() {
    await this.dbRepository.addDummyData();
  }

  async removeAll() {
    await this.dbRepository.removeAll();
  }
}
