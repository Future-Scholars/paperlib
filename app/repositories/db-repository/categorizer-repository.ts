import Realm, { Results } from "realm";
import { Categorizer, CategorizerType } from "../../models/categorizer";
import { MainRendererStateStore } from "../../state/renderer/appstate";

export class CategorizerRepository {
  stateStore: MainRendererStateStore;
  listened: Record<CategorizerType, boolean>;

  constructor(stateStore: MainRendererStateStore) {
    this.stateStore = stateStore;
    this.listened = {
      PaperTag: false,
      PaperFolder: false,
    };
  }

  removeListeners() {
    this.listened = {
      PaperTag: false,
      PaperFolder: false,
    };
  }

  load(
    type: CategorizerType,
    sortBy: string,
    sortOrder: string,
    realm: Realm
  ): Realm.Results<Categorizer & Realm.Object> {
    const objects = realm
      .objects<Categorizer>(type)
      .sorted(sortBy, sortOrder == "desc");

    if (!this.listened[type]) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          if (type === "PaperTag") {
            this.stateStore.dbState.tagsUpdated = Date.now();
          } else if (type === "PaperFolder") {
            this.stateStore.dbState.foldersUpdated = Date.now();
          } else {
            throw new Error(`Unknown categorizer type: ${type}`);
          }
        }
      });
      this.listened[type] = true;
    }
    return objects;
  }
}

export type CategorizerResults =
  | Results<Categorizer & Object>
  | Array<Categorizer>;
