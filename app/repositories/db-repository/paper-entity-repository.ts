import Realm, { PrimaryKey, Results } from "realm";
import { PaperEntity } from "@/models/paper-entity";
import { PaperFolder, PaperTag } from "@/models/categorizer";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { ObjectId } from "bson";

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

    this.stateStore.viewState.entitiesCount = objects.length;

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

  addDummyData(tag: PaperTag, folder: PaperFolder, realm: Realm) {
    const ids: Array<string | ObjectId> = [];
    realm.safeWrite(() => {
      for (let i = 0; i < 100; i++) {
        const entity = new PaperEntity(true);

        entity.dummyFill();

        realm.create("PaperEntity", entity);

        if (i % 5 === 0) {
          ids.push(entity.id);
        }
      }

      for (const id of ids) {
        const createdEntity = realm.objectForPrimaryKey<PaperEntity>(
          "PaperEntity",
          id as PrimaryKey
        );
        const tagObj = realm.objectForPrimaryKey<PaperTag>(
          "PaperTag",
          tag._id as PrimaryKey
        );
        const folderObj = realm.objectForPrimaryKey<PaperFolder>(
          "PaperFolder",
          folder._id as PrimaryKey
        );
        if (createdEntity && tagObj && folderObj) {
          tagObj.count += 1;
          folderObj.count += 1;
          createdEntity.tags.push(tagObj);
          createdEntity.folders.push(folderObj);
        }
      }
    });
  }
}

export type PaperEntityResults =
  | Results<PaperEntity & Object>
  | Array<PaperEntity>;
