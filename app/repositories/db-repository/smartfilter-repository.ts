import Realm, { List, Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Colors } from "@/models/categorizer";
import { OID } from "@/models/id";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { ISmartFilterServiceState } from "@/renderer/services/smartfilter-service";
import { ObjectId } from "bson";

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
   * Transform smartfilter to realm object if exists in database. Otherwise, return undefined.
   * @param realm - Realm instance
   * @param paperSmartFilter - PaperSmartFilter
   * @returns Realm object or undefined
   */
  toRealmObject(realm: Realm, paperSmartFilter: IPaperSmartFilterObject) {
    if (paperSmartFilter instanceof Realm.Object) {
      return paperSmartFilter as IPaperSmartFilterObject;
    } else {
      const objects = realm
        .objects<PaperSmartFilter>("PaperPaperSmartFilter")
        .filtered(`name == "${paperSmartFilter.name}"`);

      if (objects.length > 0) {
        return objects[0] as IPaperSmartFilterObject;
      } else {
        return undefined;
      }
    }
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
   * Load smartfilter by ids
   * @param realm - Realm instance
   * @param type - SmartFilter type
   * @param ids - SmartFilter ids
   * @returns Results of smartfilter
   */
  loadByIds(
    realm: Realm,
    type: PaperSmartFilterType,
    ids: OID[]
  ): IPaperSmartFilterCollection {
    const idsQuery = ids.map((id) => `oid(${id})`).join(", ");

    let objects = realm
      .objects<PaperSmartFilter>(type)
      .filtered(`_id IN {${idsQuery}}`);

    return objects;
  }

  /**
   * Delete smartfilter
   * @param realm - Realm instance
   * @param type - SmartFilter type
   * @param ids - SmartFilter ids
   * @param smartfilters - SmartFilters
   * @returns True if success
   */
  delete(
    realm: Realm,
    type: PaperSmartFilterType,
    ids?: OID[],
    smartfilters?: IPaperSmartFilterCollection
  ) {
    return realm.safeWrite(() => {
      let objects: IPaperSmartFilterCollection;
      if (smartfilters) {
        objects = smartfilters
          .map((smartfilter: IPaperSmartFilterObject) =>
            this.toRealmObject(realm, smartfilter)
          )
          .filter((smartfilter) => smartfilter) as IPaperSmartFilterCollection;
      } else if (ids) {
        objects = this.loadByIds(realm, type, ids);
      } else {
        throw new Error(`Invalid arguments: ${smartfilters}, ${ids}, ${type}`);
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
    id?: OID,
    smartfilter?: PaperSmartFilter
  ) {
    realm.safeWrite(() => {
      let objects: IPaperSmartFilterCollection;
      if (smartfilter) {
        const object = this.toRealmObject(realm, smartfilter);
        objects = object ? [object] : [];
      } else if (id) {
        objects = this.loadByIds(realm, type, [id]);
      } else {
        throw new Error(`Invalid arguments: ${smartfilter}, ${name}, ${type}`);
      }
      for (const object of objects) {
        object.color = color;
      }
    });
  }

  makeSureProperties(smartfilter: IPaperSmartFilterObject) {
    smartfilter._id = smartfilter._id
      ? new ObjectId(smartfilter._id)
      : new ObjectId();
    smartfilter._partition = smartfilter._partition || "";
    smartfilter.name = smartfilter.name || "";
    smartfilter.color = smartfilter.color || Colors.blue;
    smartfilter.filter = smartfilter.filter || "";
    return smartfilter;
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
    smartfilter: IPaperSmartFilterObject,
    type: PaperSmartFilterType,
    partition: string
  ) {
    smartfilter = this.makeSureProperties(smartfilter);

    return realm.safeWrite(() => {
      // Add or Link categorizer
      const dbExistPaperSmartFilter = this.toRealmObject(realm, smartfilter);

      if (dbExistPaperSmartFilter) {
        throw new Error(
          `SmartFilter already exists: ${smartfilter.name}, ${type}`
        );
      } else {
        if (partition) {
          smartfilter._partition = partition;
        }

        return realm.create(type, smartfilter);
      }
    });
  }
}

export type IPaperSmartFilterRealmObject = PaperSmartFilter &
  Realm.Object<PaperSmartFilter, "_id" | "name" | "filter">;

export type IPaperSmartFilterObject =
  | PaperSmartFilter
  | IPaperSmartFilterRealmObject;

export type IPaperSmartFilterCollection =
  | Results<IPaperSmartFilterObject>
  | List<IPaperSmartFilterObject>
  | Array<IPaperSmartFilterObject>;
