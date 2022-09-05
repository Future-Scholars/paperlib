import Realm, { Results } from "realm";
import { PaperEntity } from "@/models/paper-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export class PaperEntityRepository {
  stateStore: MainRendererStateStore;
  listened: boolean;

  constructor(stateStore: MainRendererStateStore) {
    this.stateStore = stateStore;
    this.listened = false;
  }

  removeListeners() {
    this.listened = false;
  }

  load(realm: Realm) {
    const objects = realm.objects<PaperEntity>("PaperEntity");

    if (!this.listened) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.stateStore.dbState.entitiesUpdated = Date.now();
        }
      });
      this.listened = true;
    }
    return objects;
  }

  // ==============================
  // Dev Functions
  // ==============================

  removeAll(realm: Realm) {
    const objects = realm.objects<PaperEntity>("PaperEntity");
    realm.safeWrite(() => {
      realm.delete(objects);
    });
  }

  addDummyData(realm: Realm) {
    realm.safeWrite(() => {
      for (let i = 0; i < 10000; i++) {
        const entity = new PaperEntity(true);
        entity.dummyFill();
        realm.create("PaperEntity", entity);
      }
    });
  }
}

export type PaperEntityResults =
  | Results<PaperEntity & Object>
  | Array<PaperEntity>;
