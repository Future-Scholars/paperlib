import Realm, { List, Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Categorizer, CategorizerType, Colors } from "@/models/categorizer";
import { OID } from "@/models/id";
import { ObjectId } from "bson";

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
   * Transform categorizer to realm object if exists in database. Otherwise, return undefined.
   * @param realm - Realm instance
   * @param type - Categorizer type
   * @param categorizer - Categorizer
   * @returns Realm object or undefined
   */
  toRealmObject(
    realm: Realm,
    type: CategorizerType,
    categorizer: ICategorizerObject
  ) {
    if (categorizer instanceof Realm.Object) {
      return categorizer as ICategorizerRealmObject;
    } else {
      const objects = realm
        .objects<Categorizer>(type)
        .filtered(`name == "${categorizer.name}"`);

      if (objects.length > 0) {
        return objects[0] as ICategorizerRealmObject;
      } else {
        return undefined;
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

  /**
   * Delete categorizer.
   * @param realm - Realm instance.
   * @param deleteAll - Delete all categorizers.
   * @param type - Categorizer type.
   * @param id - Id of categorizer to delete.
   * @param categorizer - Categorizer to delete.
   */
  delete(
    realm: Realm,
    deleteAll = true,
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
  }

  /**
   * Colorize categorizer.
   * @param realm - Realm instance
   * @param color - Color
   * @param type - Categorizer type
   * @param categorizer - Categorizer
   * @param name - Name of categorizer
   * @returns True if success
   */
  colorize(
    realm: Realm,
    color: Colors,
    type: CategorizerType,
    id?: OID,
    categorizer?: ICategorizerObject
  ) {
    realm.safeWrite(() => {
      let objects: ICategorizerCollection;
      if (categorizer) {
        const object = this.toRealmObject(realm, type, categorizer);
        if (object) {
          objects = [object];
        } else {
          objects = [];
        }
      } else if (id) {
        objects = realm
          .objects<Categorizer>(type)
          .filtered(`_id == oid(${id})`);
      } else {
        throw new Error(`Invalid arguments: ${categorizer}, ${id}, ${type}`);
      }
      for (const object of objects) {
        object.color = color;
      }
    });
  }

  /**
   * Rename categorizer.
   * @param realm - Realm instance
   * @param oldName - Old name
   * @param newName - New name
   * @param type - Categorizer type
   * @returns True if success
   */
  rename(
    realm: Realm,
    oldName: string,
    newName: string,
    type: CategorizerType
  ) {
    return realm.safeWrite(() => {
      const objects = realm
        .objects<Categorizer>(type)
        .filtered(`name == "${oldName}"`);
      for (const object of objects) {
        object.name = newName;
      }
      return true;
    });
  }

  makeSureProperties(categorizer: ICategorizerObject) {
    categorizer._id = categorizer._id
      ? new ObjectId(categorizer._id)
      : new ObjectId();
    categorizer._partition = categorizer._partition || "";
    categorizer.name = categorizer.name || "";
    categorizer.color = categorizer.color || Colors.blue;
    categorizer.count = categorizer.count || 0;

    return categorizer;
  }

  /**
   * Update/Insert categorizer.
   * @param realm - Realm instance
   * @param type - Categorizer type
   * @param categorizer - Categorizer
   * @param partition - Partition
   * @returns Categorizer
   */
  update(
    realm: Realm,
    type: CategorizerType,
    categorizer: ICategorizerObject,
    partition: string
  ) {
    categorizer = this.makeSureProperties(categorizer);

    return realm.safeWrite(() => {
      const object = this.toRealmObject(realm, type, categorizer);

      if (object) {
        object.name = categorizer.name;
        object.color = categorizer.color;
        object.count = categorizer.count;
        if (partition) {
          object._partition = partition;
        }
        return object;
      } else {
        const newObject = realm.create<Categorizer>(type, categorizer);
        if (partition) {
          newObject._partition = partition;
        }
        return newObject;
      }
    });
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

      for (const categorizer of categorizerRealmObjects) {
        categorizer.count = categorizer.linkingObjectsCount();
      }
    });
  }
}

export type ICategorizerRealmObject = Categorizer &
  Realm.Object<Categorizer, "_id" | "name" | "count">;

export type ICategorizerObject = Categorizer | ICategorizerRealmObject;

export type ICategorizerCollection =
  | Results<ICategorizerObject>
  | List<ICategorizerObject>
  | Array<ICategorizerObject>;
