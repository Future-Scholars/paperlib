import { CategorizerType } from "@/models/categorizer";
import { DBRepository } from "@/repositories/db-repository/db-repository";
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

  async loadPaperEntities() {
    return await this.dbRepository.paperEntities();
  }

  async loadCategorizers(
    type: CategorizerType,
    sortBy: string,
    sortOrder: string
  ) {
    return await this.dbRepository.categorizers(type, sortBy, sortOrder);
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
