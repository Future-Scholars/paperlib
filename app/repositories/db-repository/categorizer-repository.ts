import Realm, { Results } from "realm";

import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { MainRendererStateStore } from "@/state/renderer/appstate";

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

  // ========================
  // CRUD
  // ========================
  // ========================
  // Read
  // ========================
  load(
    realm: Realm,
    type: CategorizerType,
    sortBy: string,
    sortOrder: string
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

  // ========================
  // Delete
  // ========================
  delete(
    realm: Realm,
    deleteAll = true,
    type: CategorizerType,
    categorizer?: Categorizer,
    name?: string
  ) {
    try {
      return realm.safeWrite(() => {
        let objects;
        if (categorizer) {
          objects = realm
            .objects<Categorizer>(type)
            .filtered(`name == "${categorizer.name}"`);
        } else if (name) {
          objects = realm
            .objects<Categorizer>(type)
            .filtered(`name == "${name}"`);
        } else {
          throw new Error(
            `Invalid arguments: ${categorizer}, ${name}, ${type}`
          );
        }

        if (deleteAll) {
          realm.delete(objects);
        } else {
          for (const object of objects) {
            object.count -= 1;
            if (object.count <= 0) {
              realm.delete(object);
            }
          }
        }
        return true;
      });
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to delete categorizer: ${
        error as string
      }`;
      return false;
    }
  }

  // ========================
  // Update
  // ========================
  async colorize(
    realm: Realm,
    color: Colors,
    type: CategorizerType,
    categorizer?: Categorizer,
    name?: string
  ) {
    realm.safeWrite(() => {
      let objects;
      if (categorizer) {
        objects = realm
          .objects<Categorizer>(type)
          .filtered(`name == "${categorizer.name}"`);
      } else if (name) {
        objects = realm
          .objects<Categorizer>(type)
          .filtered(`name == "${name}"`);
      } else {
        throw new Error(`Invalid arguments: ${categorizer}, ${name}, ${type}`);
      }
      for (const object of objects) {
        object.color = color;
      }
    });
  }

  async rename(
    realm: Realm,
    oldName: string,
    newName: string,
    type: CategorizerType
  ) {
    realm.safeWrite(() => {
      const objects = realm
        .objects<Categorizer>(type)
        .filtered(`name == "${oldName}"`);
      for (const object of objects) {
        object.name = newName;
      }
    });
  }

  update(
    realm: Realm,
    existCategorizers: Categorizer[],
    updateCategorizers: Categorizer[],
    type: CategorizerType,
    partition: string
  ) {
    try {
      return realm.safeWrite(() => {
        let newCategorizers = [];
        const existCategorizerNameList = existCategorizers.map(
          (categorizer) => {
            return categorizer.name;
          }
        );
        const updatedCategorizerNameList = updateCategorizers.map(
          (categorizer) => {
            return categorizer.name;
          }
        );

        // Remove categorizer that is not in updated categorizers
        for (const existCategorizer of existCategorizers) {
          if (!updatedCategorizerNameList.includes(existCategorizer.name)) {
            existCategorizer.count -= 1;
            if (existCategorizer.count <= 0) {
              realm.delete(existCategorizer);
            }
          }
        }

        // Add or Link categorizer
        for (const name of updatedCategorizerNameList) {
          const dbExistCategorizers = realm
            .objects<Categorizer>(type)
            .filtered(`name == "${name}"`);

          if (!existCategorizerNameList.includes(name)) {
            if (dbExistCategorizers.length > 0) {
              const categorizer = dbExistCategorizers[0];
              categorizer.count += 1;
              newCategorizers.push(categorizer);
            } else {
              const categorizer =
                type === "PaperTag"
                  ? new PaperTag(name, 1)
                  : new PaperFolder(name, 1);
              if (partition) {
                categorizer["_partition"] = partition;
              }
              realm.create(type, categorizer);
              newCategorizers.push(categorizer);
            }
          } else {
            newCategorizers.push(dbExistCategorizers[0]);
          }
        }
        return newCategorizers;
      });
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to update categorizers: ${
        error as string
      }`;
      return [];
    }
  }

  // ========================
  // Dev Functions
  // ========================
  async addDummyData(realm: Realm) {
    const tag = new PaperTag("test-tag-1", 1);
    const folder = new PaperFolder("test-folder-1", 1);
    realm.write(() => {
      realm.create("PaperTag", tag);
      realm.create("PaperFolder", folder);
    });

    return { tag, folder };
  }

  async deleteAll(realm: Realm) {
    realm.write(() => {
      const tags = realm.objects<Categorizer>("PaperTag");
      realm.delete(tags);
      const folders = realm.objects<Categorizer>("PaperFolder");
      realm.delete(folders);
    });
  }
}

export type CategorizerResults =
  | Results<Categorizer & Realm.Object>
  | Array<Categorizer>;
