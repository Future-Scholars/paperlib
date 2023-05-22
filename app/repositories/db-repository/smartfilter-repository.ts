import Realm, { Results } from "realm";

import { Colors } from "@/models/categorizer";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { MainRendererStateStore } from "@/state/renderer/appstate";

export class PaperSmartFilterRepository {
  stateStore: MainRendererStateStore;
  listened: Record<PaperSmartFilterType, boolean>;

  constructor(stateStore: MainRendererStateStore) {
    this.stateStore = stateStore;
    this.listened = {
      PaperPaperSmartFilter: false,
    };
  }

  removeListeners() {
    this.listened = {
      PaperPaperSmartFilter: false,
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
    type: PaperSmartFilterType,
    sortBy: string,
    sortOrder: string
  ): Realm.Results<PaperSmartFilter & Realm.Object> {
    const objects = realm
      .objects<PaperSmartFilter>(type)
      .sorted(sortBy, sortOrder == "desc");

    if (!this.listened[type]) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.stateStore.dbState.smartfiltersUpdated = Date.now();
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
    type: PaperSmartFilterType,
    smartfilter?: PaperSmartFilter,
    name?: string
  ) {
    try {
      return realm.safeWrite(() => {
        let objects;
        if (smartfilter) {
          objects = realm
            .objects<PaperSmartFilter>(type)
            .filtered(`name == "${smartfilter.name}"`);
        } else if (name) {
          objects = realm
            .objects<PaperSmartFilter>(type)
            .filtered(`name == "${name}"`);
        } else {
          throw new Error(
            `Invalid arguments: ${smartfilter}, ${name}, ${type}`
          );
        }

        realm.delete(objects);
        return true;
      });
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to delete smartfilter: ${
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
    type: PaperSmartFilterType,
    smartfilter?: PaperSmartFilter,
    name?: string
  ) {
    realm.safeWrite(() => {
      let objects;
      if (smartfilter) {
        objects = realm
          .objects<PaperSmartFilter>(type)
          .filtered(`name == "${smartfilter.name}"`);
      } else if (name) {
        objects = realm
          .objects<PaperSmartFilter>(type)
          .filtered(`name == "${name}"`);
      } else {
        throw new Error(`Invalid arguments: ${smartfilter}, ${name}, ${type}`);
      }
      for (const object of objects) {
        object.color = color;
      }
    });
  }

  insert(
    realm: Realm,
    smartfilter: PaperSmartFilter,
    type: PaperSmartFilterType,
    partition: string
  ) {
    try {
      return realm.safeWrite(() => {
        // Add or Link categorizer
        const dbExistPaperSmartFilter = realm
          .objects<PaperSmartFilter>(type)
          .filtered(`name == "${smartfilter.name}"`);

        if (dbExistPaperSmartFilter.length > 0) {
          this.stateStore.logState.alertLog = `Smart filter: ${smartfilter.name} already exists.`;
          return null;
        } else {
          const smarfilter = new PaperSmartFilter(
            smartfilter.name,
            smartfilter.filter,
            smartfilter.color,
            partition
          );
          realm.create(type, smarfilter);
          return smarfilter;
        }
      });
    } catch (error) {
      console.error(error);
      this.stateStore.logState.alertLog = `Failed to update categorizers: ${
        error as string
      }`;
      return null;
    }
  }
}

export type PaperSmartFilterResults =
  | Results<PaperSmartFilter & Realm.Object>
  | Array<PaperSmartFilter>;
