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
import { ILogService, LogService } from "@/common/services/log-service";

export interface ICategorizerRepositoryState {
  tagsUpdated: number;
  foldersUpdated: number;
}

export const ICategorizerRepository = createDecorator("categorizerRepository");

export class CategorizerRepository extends Eventable<ICategorizerRepositoryState> {
  constructor(
    @ILogService
    private readonly _logService: LogService,
  ) {
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
  async load(
    realm: Realm,
    type: CategorizerType,
    sortBy: string,
    sortOrder: string
  ): Promise<ICategorizerCollection> {
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

    // Realm is updated via projection (SQLite SoT); no sync-to-SQLite on load
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
   * Recursively collect all categorizers that need to be deleted (including children).
   * Used by CategorizerService before calling SQLite delete + ensureCaughtUp + removeFromRealm.
   */
  collectAllToDelete(
    realm: Realm,
    type: CategorizerType,
    objects: ICategorizerCollection
  ): ICategorizerCollection {
    const allObjects: ICategorizerCollection = [...objects];
    for (const object of objects) {
      if (object.children.length > 0) {
        const childObjects = this.collectAllToDelete(realm, type, object.children);
        allObjects.push(...childObjects);
      }
    }
    return allObjects;
  }

  /**
   * Remove categorizer objects from Realm by ids (after SQLite delete + ensureCaughtUp).
   * Realm is not the source of truth; this only keeps Realm in sync with SQLite.
   */
  removeFromRealm(
    realm: Realm,
    type: CategorizerType,
    ids: string[]
  ): void {
    realm.safeWrite(() => {
      for (const id of ids) {
        const obj = realm.objectForPrimaryKey<Categorizer>(
          type,
          new Realm.BSON.ObjectId(id)
        );
        if (obj) realm.delete(obj);
      }
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