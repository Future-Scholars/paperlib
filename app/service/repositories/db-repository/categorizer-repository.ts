import Realm, { List, Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  Categorizer,
  CategorizerType,
  Colors,
  ICategorizerCollection,
  ICategorizerObject,
  ICategorizerRealmObject,
  PaperTag,
} from "@/models/categorizer";
import { OID } from "@/models/id";
import { Entity } from "@/models/entity";
import { toSqliteCategorizer } from "@/service/services/sync/sqlite-pollyfill";

export interface ICategorizerRepositoryState {
  tagsUpdated: number;
  foldersUpdated: number;
}

export const ICategorizerRepository = createDecorator("categorizerRepository");

export class CategorizerRepository extends Eventable<ICategorizerRepositoryState> {
  constructor() {
    super("categorizerRepository", {
      tagsUpdated: 0,
      foldersUpdated: 0,
    });
  }

  /**
   * Transform categorizer to realm object if exists in database. Otherwise, return null.
   * @param realm - Realm instance
   * @param type - Categorizer type
   * @param categorizer - Categorizer
   * @returns Realm object or null
   */
  toRealmObject(
    realm: Realm,
    type: CategorizerType,
    categorizer: ICategorizerObject
  ) {
    // For Root
    if (categorizer instanceof Realm.Object) {
      return categorizer as ICategorizerRealmObject;
    } else {
      if (type === CategorizerType.PaperTag) {
        // Return Root
        if (categorizer.name === "Tags") {
          return realm
            .objects<Categorizer>(type)
            .filtered(`name == "Tags"`)[0] as ICategorizerRealmObject;
        }

        // Keep Atomic
        const objects = realm
          .objects<Categorizer>(type)
          .filtered(`name == "${categorizer.name}"`);

        if (objects.length > 0) {
          return objects[0] as ICategorizerRealmObject;
        } else {
          const object = realm.objectForPrimaryKey<Categorizer>(
            type,
            new Realm.BSON.ObjectId(categorizer._id)
          );
          return object as ICategorizerRealmObject | null;
        }
      } else {
        // Return Root
        if (categorizer.name === "Folders") {
          return realm
            .objects<Categorizer>(type)
            .filtered(`name == "Folders"`)[0] as ICategorizerRealmObject;
        }

        let object: ICategorizerObject | null;
        if (categorizer._id) {
          object = realm.objectForPrimaryKey<Categorizer>(
            type,
            new Realm.BSON.ObjectId(categorizer._id)
          );
        } else {
          const objects = realm
            .objects<Categorizer>(type)
            .filtered(`name == "${categorizer.name}"`);
          if (objects.length > 0) {
            object = objects[0];
          } else {
            object = null;
          }
        }
        return object as ICategorizerRealmObject | null;
      }
    }
  }

  /**
   * Load all categorizers.
   * @param realm - Realm instance
   * @param type - Categorizer type
   * @param sortBy - Sort by field
   * @param sortOrder - Sort order
   * @returns Results of categorizer
   */
  load(
    realm: Realm,
    type: CategorizerType,
    sortBy: string,
    sortOrder: string
  ): ICategorizerCollection {
    const objects = realm
      .objects<Categorizer>(type)
      .sorted(sortBy, sortOrder == "desc");

    if (
      !{ PaperTag: realm.tagsListened, PaperFolder: realm.foldersListened }[
        type
      ]
    ) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          if (type === CategorizerType.PaperTag) {
            this.fire("tagsUpdated");
          } else if (type === CategorizerType.PaperFolder) {
            this.fire("foldersUpdated");
          } else {
            throw new Error(`Unknown categorizer type: ${type}`);
          }
        }
      });
      if (type === CategorizerType.PaperTag) {
        realm.tagsListened = true;
      } else if (type === CategorizerType.PaperFolder) {
        realm.foldersListened = true;
      } else {
        throw new Error(`Unknown categorizer type: ${type}`);
      }
      
    }

    // Sync objects to sqlite database
    objects.forEach(async (object) => {
      await toSqliteCategorizer(object, type);
    });

    return objects;
  }

  /**
   * Load categorizer by ids.
   * @param realm - Realm instance
   * @param ids - Categorizers id
   * @returns Categorizers
   */
  loadByIds(
    realm: Realm,
    type: CategorizerType,
    ids: OID[]
  ): ICategorizerCollection {
    const idsQuery = ids.map((id) => `oid(${id})`).join(", ");

    let objects = realm
      .objects<Categorizer>(type)
      .filtered(`_id IN { ${idsQuery} }`);

    return objects;
  }

  createRoots(realm: Realm, partation: string) {
    realm.safeWrite(() => {
      const tags = realm
        .objects<Categorizer>(CategorizerType.PaperTag)
        .filtered(`name == "Tags"`);

      if (tags.length === 0) {
        realm.create<Categorizer>(
          CategorizerType.PaperTag,
          new PaperTag(
            {
              _partition: partation,
              name: "Tags",
              color: Colors.blue,
              children: [],
            },
            true
          )
        );
      }

      const folders = realm
        .objects<Categorizer>(CategorizerType.PaperFolder)
        .filtered(`name == "Folders"`);

      if (folders.length === 0) {
        realm.create<Categorizer>(
          CategorizerType.PaperFolder,
          new PaperTag(
            {
              _partition: partation,
              name: "Folders",
              color: Colors.blue,
              children: [],
            },
            true
          )
        );
      }
    });
  }

  /**
   * Delete categorizer.
   * @param realm - Realm instance.
   * @param type - Categorizer type.
   * @param id - Id of categorizer to delete.
   * @param categorizer - Categorizer to delete.
   */
  delete(
    realm: Realm,
    type: CategorizerType,
    ids?: OID[],
    categorizers?: ICategorizerCollection
  ) {
    return realm.safeWrite(() => {
      let objects: ICategorizerCollection;
      if (categorizers) {
        objects = categorizers
          .map((categorizer: ICategorizerObject) =>
            this.toRealmObject(realm, type, categorizer)
          )
          .filter((object) => object) as ICategorizerCollection;
      } else if (ids) {
        objects = this.loadByIds(realm, type, ids);
      } else {
        throw new Error(`Invalid arguments: ${categorizers}, ${ids}, ${type}`);
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

  makeSureProperties(categorizer: ICategorizerObject) {
    categorizer._id = (categorizer._id
      ? new Realm.BSON.ObjectId(categorizer._id)
      : new Realm.BSON.ObjectId()) as unknown as OID;
    categorizer._partition = categorizer._partition || "";
    categorizer.name = categorizer.name || "";
    categorizer.color = categorizer.color || Colors.blue;

    return categorizer;
  }

  /**
   * Update/Insert categorizer.
   * @param realm - Realm instance
   * @param type - Categorizer type
   * @param categorizer - Categorizer
   * @param partition - Partition
   * @param parent - Parent categorizer
   * @returns Categorizer
   */
  update(
    realm: Realm,
    type: CategorizerType,
    categorizer: ICategorizerObject,
    partition: string,
    parent?: ICategorizerObject
  ) {
    categorizer = this.makeSureProperties(categorizer);

    return realm.safeWrite(() => {
      const object = this.toRealmObject(realm, type, categorizer);

      if (object) {
        // Update
        const preSelfName = object.name.split("/").pop();

        object.name = [...object.name.split("/").slice(0, -1), categorizer.name]
          .filter((x) => x)
          .join("/");

        object.color = categorizer.color;
        if (partition) {
          object._partition = partition;
        }

        if (parent) {
          const preParents = object.linkingObjects<ICategorizerRealmObject>(
            type,
            "children"
          );
          const preParent = preParents.length > 0 ? preParents[0] : undefined;
          const curParent = this.toRealmObject(realm, type, parent);

          this._checkCircularReference(realm, type, object, parent);

          if (
            preParent &&
            curParent &&
            preParent._id.toString() !== curParent?._id.toString()
          ) {
            preParent.children.splice(preParent.children.indexOf(object), 1);

            curParent.children.push(object);

            // Update name
            object.name = [
              `${
                curParent.name === "Tags" || curParent.name === "Folders"
                  ? ""
                  : curParent.name
              }`,
              `${categorizer.name}`,
            ]
              .filter((x) => x)
              .join("/");
          }
        }

        if (preSelfName !== categorizer.name) {
          // Update children name
          this._updateChildrenName(realm, type, object);
        }

        return object;
      } else {
        // Insert
        let parentObject: ICategorizerRealmObject | null;
        if (!parent) {
          parentObject = realm
            .objects<Categorizer>(type)
            .filtered(
              `name == '${
                type === CategorizerType.PaperTag ? "Tags" : "Folders"
              }'`
            )[0] as ICategorizerRealmObject;
        } else {
          parentObject = this.toRealmObject(realm, type, parent);
        }

        if (partition) {
          categorizer._partition = partition;
        }
        const newObject = realm.create<Categorizer>(type, categorizer);
        if (parentObject) {
          // concat parent name
          if (
            parentObject.name &&
            parentObject.name !== "Tags" &&
            parentObject.name !== "Folders"
          ) {
            newObject.name = `${parentObject.name}/${newObject.name}`;
          }

          parentObject.children.push(newObject);
        } else {
          throw new Error(
            `Parent object not found: ${parent}, ${type}, ${categorizer}`
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
    type: CategorizerType,
    categorizer: ICategorizerObject
  ) {
    const children = categorizer.children;
    for (const child of children) {
      child.name = `${categorizer.name}/${child.name.split("/").pop()}`;
      this._updateChildrenName(realm, type, child);
    }
  }

  /**
   * Check circular reference.
   */
  private _checkCircularReference(
    realm: Realm,
    type: CategorizerType,
    categorizer: ICategorizerObject,
    parent: ICategorizerObject
  ) {
    const children = categorizer.children;
    for (const child of children) {
      if (child._id.toString() === parent._id.toString()) {
        throw new Error("Circular reference");
      }
      this._checkCircularReference(realm, type, child, parent);
    }
  }

  updateCount(
    realm: Realm,
    type: CategorizerType,
    categorizers: ICategorizerCollection
  ) {
    return realm.safeWrite(() => {
      const categorizerRealmObjects = categorizers.map(
        (categorizer: ICategorizerObject) =>
          this.toRealmObject(realm, type, categorizer)
      ) as ICategorizerRealmObject[];

      categorizerRealmObjects.forEach((categorizer) => {
        categorizer.count = categorizer.linkingObjects<Entity>(
          Entity.schema.name,
          type === CategorizerType.PaperTag ? "tags" : "folders"
        ).length;
      });
    });
  }
}