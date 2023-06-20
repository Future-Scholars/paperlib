import Realm, { Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Colors } from "@/models/categorizer";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { ISmartFilterServiceState } from "@/renderer/services/smartfilter-service";

export const IPaperSmartFilterRepository = createDecorator(
  "paperSmartFilterRepository"
);

export class PaperSmartFilterRepository extends Eventable<ISmartFilterServiceState> {
  constructor() {
    super("paperSmartFilterRepository", {
      updated: 0,
    });
  }

  /**
   *
   * @param realm - Realm instance
   * @param type - SmartFilter type
   * @param sortBy - Sort by field
   * @param sortOrder - Sort order
   * @returns Results of smartfilter
   */
  load(
    realm: Realm,
    type: PaperSmartFilterType,
    sortBy: string,
    sortOrder: string
  ): Realm.Results<PaperSmartFilter & Realm.Object> {
    const objects = realm
      .objects<PaperSmartFilter>(type)
      .sorted(sortBy, sortOrder == "desc");

    if (!realm.smartfilterListened) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.fire("updated");
        }
      });
      realm.smartfilterListened = true;
    }
    return objects;
  }

  /**
   * Delete smartfilter
   * @param realm - Realm instance
   * @param type - SmartFilter type
   * @param smartfilter - SmartFilter
   * @param name - SmartFilter name
   * @returns True if success
   */
  delete(
    realm: Realm,
    type: PaperSmartFilterType,
    smartfilter?: PaperSmartFilter,
    name?: string
  ) {
    return realm.safeWrite(() => {
      let objects: IPaperSmartFilterResults;
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

      realm.delete(objects);
      return true;
    });
  }

  /**
   * Colorize smartfilter
   * @param realm - Realm instance
   * @param color - Color
   * @param type - SmartFilter type
   * @param smartfilter - SmartFilter
   * @param name - SmartFilter name
   * @returns True if success
   */
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

  /**
   * Update smartfilter
   * @param realm - Realm instance
   * @param smartfilter - SmartFilter
   * @param type - SmartFilter type
   * @param partition - Partition
   * @returns Updated smartfilter
   */
  insert(
    realm: Realm,
    smartfilter: PaperSmartFilter,
    type: PaperSmartFilterType,
    partition: string
  ) {
    return realm.safeWrite(() => {
      // Add or Link categorizer
      const dbExistPaperSmartFilter = realm
        .objects<PaperSmartFilter>(type)
        .filtered(`name == "${smartfilter.name}"`);

      if (dbExistPaperSmartFilter.length > 0) {
        throw new Error(
          `SmartFilter already exists: ${smartfilter.name}, ${type}`
        );
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
  }
}

export type IPaperSmartFilterResults =
  | Results<PaperSmartFilter & Realm.Object>
  | Array<PaperSmartFilter>;
