import Realm, { List, Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Colors } from "@/models/categorizer";
import { OID } from "@/models/id";
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
   * Transform smartfilter to realm object if exists in database. Otherwise, return undefined.
   * @param realm - Realm instance
   * @param paperSmartFilter - PaperSmartFilter
   * @returns Realm object or undefined
   */
  toRealmObject(realm: Realm, paperSmartFilter: IPaperSmartFilterObject) {
    if (paperSmartFilter instanceof Realm.Object) {
      return paperSmartFilter as IPaperSmartFilterRealmObject;
    } else {
      const object = realm.objectForPrimaryKey<PaperSmartFilter>(
        PaperSmartFilter.schema.name,
        new Realm.BSON.ObjectId(paperSmartFilter._id)
      );

      return object as IPaperSmartFilterRealmObject | null;
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

  createRoots(realm: Realm, partition: string) {
    const roots = realm
      .objects<PaperSmartFilter>(PaperSmartFilter.schema.name)
      .filtered(`name == 'SmartFilters'`);
    if (roots.length === 0) {
      const root = realm.create<PaperSmartFilter>(
        PaperSmartFilter.schema.name,
        new PaperSmartFilter(
          {
            _partition: partition,
            name: "SmartFilters",
            color: Colors.blue,
            filter: "true",
            children: [],
          },
          true
        )
      );
    }
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

      for (const object of objects) {
        if (object.children.length > 0) {
          this.delete(realm, type, undefined, object.children);
        }
      }

      realm.delete(objects);
      return true;
    });
  }

  makeSureProperties(smartfilter: IPaperSmartFilterObject) {
    smartfilter._id = (smartfilter._id
      ? new Realm.BSON.ObjectId(smartfilter._id)
      : new Realm.BSON.ObjectId()) as unknown as OID;
    smartfilter._partition = smartfilter._partition || "";
    smartfilter.name = smartfilter.name || "";
    smartfilter.color = smartfilter.color || Colors.blue;
    smartfilter.filter = smartfilter.filter || "true";
    return smartfilter;
  }

  /**
   * Update smartfilter
   * @param realm - Realm instance
   * @param type - SmartFilter type
   * @param smartfilter - SmartFilter
   * @param partition - Partition
   * @returns Updated smartfilter
   */
  update(
    realm: Realm,
    type: PaperSmartFilterType,
    smartfilter: IPaperSmartFilterObject,
    partition: string,
    parent?: IPaperSmartFilterObject
  ) {
    smartfilter = this.makeSureProperties(smartfilter);

    return realm.safeWrite(() => {
      const object = this.toRealmObject(realm, smartfilter);

      if (object) {
        // Update
        const preSelfName = object.name.split("/").pop();

        object.name = [...object.name.split("/").slice(0, -1), smartfilter.name]
          .filter((x) => x)
          .join("/");

        object.color = smartfilter.color;
        object.filter = smartfilter.filter;
        if (partition) {
          object._partition = partition;
        }

        if (parent) {
          const preParents =
            object.linkingObjects<IPaperSmartFilterRealmObject>(
              type,
              "children"
            );
          const preParent = preParents.length > 0 ? preParents[0] : undefined;
          const curParent = this.toRealmObject(realm, parent);

          this._checkCircularReference(realm, type, object, parent);

          if (preParent && curParent && preParent._id != curParent._id) {
            preParent.children.splice(preParent.children.indexOf(object), 1);

            curParent.children.push(object);

            // Update name
            object.name = [
              `${curParent.name === "SmartFilters" ? "" : curParent.name}`,
              `${smartfilter.name}`,
            ].join("/");
          }
        }

        if (preSelfName !== smartfilter.name) {
          // Update children name
          this._updateChildrenName(realm, type, object);
        }

        return object;
      } else {
        // Insert
        let parentObject: IPaperSmartFilterRealmObject | null;
        if (!parent) {
          parentObject = realm
            .objects<PaperSmartFilter>(type)
            .filtered(
              `name == 'SmartFilters'`
            )[0] as IPaperSmartFilterRealmObject;
        } else {
          parentObject = this.toRealmObject(realm, parent);
        }

        const newObject = realm.create<PaperSmartFilter>(type, smartfilter);
        if (partition) {
          newObject._partition = partition;
        }
        if (parentObject) {
          // concat parent name
          if (parentObject.name && parentObject.name !== "SmartFilters") {
            newObject.name = `${parentObject.name}/${newObject.name}`;
          }

          parentObject.children.push(newObject);
        } else {
          throw new Error(
            `Parent object not found: ${parent}, ${type}, ${smartfilter}`
          );
        }

        return newObject;
      }
    });
  }

  /**
   * Recursively update children name.
   */
  private _updateChildrenName(
    realm: Realm,
    type: PaperSmartFilterType,
    smartfilter: IPaperSmartFilterObject
  ) {
    const children = smartfilter.children;
    for (const child of children) {
      child.name = `${smartfilter.name}/${child.name.split("/").pop()}`;
      this._updateChildrenName(realm, type, child);
    }
  }

  private _checkCircularReference(
    realm: Realm,
    type: PaperSmartFilterType,
    smartfilter: IPaperSmartFilterObject,
    parent: IPaperSmartFilterObject
  ) {
    const children = smartfilter.children;
    for (const child of children) {
      if (child._id.toString() === parent._id.toString()) {
        throw new Error("Circular reference");
      }
      this._checkCircularReference(realm, type, child, parent);
    }
  }
}

export type IPaperSmartFilterRealmObject = PaperSmartFilter &
  Realm.Object<
    PaperSmartFilter,
    "_id" | "name" | "filter" | "color" | "children"
  >;

export type IPaperSmartFilterObject =
  | PaperSmartFilter
  | IPaperSmartFilterRealmObject;

export type IPaperSmartFilterCollection =
  | Results<IPaperSmartFilterObject>
  | List<IPaperSmartFilterObject>
  | Array<IPaperSmartFilterObject>;
