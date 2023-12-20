import Realm, { Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  Categorizer,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";

// TODO: test all methods with throwing an error.

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
  ): Realm.Results<Categorizer & Realm.Object> {
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
          if (type === "PaperTag") {
            this.fire("tagsUpdated");
          } else if (type === "PaperFolder") {
            this.fire("foldersUpdated");
          } else {
            throw new Error(`Unknown categorizer type: ${type}`);
          }
        }
      });
      if (type === "PaperTag") {
        realm.tagsListened = true;
      } else if (type === "PaperFolder") {
        realm.foldersListened = true;
      } else {
        throw new Error(`Unknown categorizer type: ${type}`);
      }
    }
    return objects;
  }

  /**
   * Delete categorizer.
   * @param realm - Realm instance.
   * @param deleteAll - Delete all categorizers.
   * @param type - Categorizer type.
   * @param categorizer - Categorizer to delete.
   * @param name - Name of categorizer to delete.
   */
  delete(
    realm: Realm,
    deleteAll = true,
    type: CategorizerType,
    categorizer?: Categorizer,
    name?: string
  ) {
    return realm.safeWrite(() => {
      let objects: ICategorizerResults;
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
    categorizer?: Categorizer,
    name?: string
  ) {
    realm.safeWrite(() => {
      let objects: ICategorizerResults;
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

  /**
   * Update categorizer.
   * @param realm - Realm instance
   * @param existCategorizers - Exist categorizers
   * @param updateCategorizers - Update categorizers
   * @param type - Categorizer type
   * @param partition - Partition
   * @returns True if success
   */
  update(
    realm: Realm,
    existCategorizers: Categorizer[],
    updateCategorizers: Categorizer[],
    type: CategorizerType,
    partition: string
  ) {
    return realm.safeWrite(() => {
      let newCategorizers: Categorizer[] = [];
      const existCategorizerNameList = existCategorizers.map((categorizer) => {
        return categorizer.name;
      });
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
                ? new PaperTag(name, 0)
                : new PaperFolder(name, 0);
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
  }
}

export type ICategorizerResults =
  | Results<Categorizer & Realm.Object>
  | Array<Categorizer>;
