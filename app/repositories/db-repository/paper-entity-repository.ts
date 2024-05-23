import { ObjectId } from "bson";
import Realm, { List, Results } from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { CategorizerType } from "@/models/categorizer";
import { OID } from "@/models/id";
import { PaperEntity } from "@/models/paper-entity";
import {
  CategorizerRepository,
  ICategorizerCollection,
  ICategorizerRepository,
} from "@/repositories/db-repository/categorizer-repository";

export interface IPaperEntityRepositoryState {
  count: number;
  updated: number;
}

export const IPaperEntityRepository = createDecorator("paperEntityRepository");

export class PaperEntityRepository extends Eventable<IPaperEntityRepositoryState> {
  constructor(
    @ICategorizerRepository
    private readonly _categorizerRepository: CategorizerRepository
  ) {
    super("paperEntityRepository", {
      count: 0,
      updated: 0,
    });
  }

  /**
   * Transform paper entity to realm object if exists in database. Otherwise, return undefined.
   * @param realm - Realm instance
   * @param paperEntity - Paper entity
   * @returns Realm object
   */
  toRealmObject(realm: Realm, paperEntity: IPaperEntityObject) {
    if (paperEntity instanceof Realm.Object) {
      return paperEntity as IPaperEntityRealmObject;
    } else {
      const objects = realm
        .objects<PaperEntity>("PaperEntity")
        .filtered(`_id == oid(${paperEntity._id})`);

      if (objects.length > 0) {
        return objects[0] as IPaperEntityRealmObject;
      } else {
        const reduplicatedObjects = realm
          .objects<PaperEntity>("PaperEntity")
          .filtered(
            "title == $0 and authors == $1",
            paperEntity.title,
            paperEntity.authors
          );
        if (reduplicatedObjects.length > 0) {
          return reduplicatedObjects[0] as IPaperEntityRealmObject;
        } else {
          return undefined;
        }
      }
    }
  }

  /**
   * Load all filtered paper entities.
   * @param realm - Realm instance.
   * @param filter - Filter string.
   * @param sortBy - Sort by field.
   * @param sortOrder - Sort order.
   * @returns - Results of paper entities.
   */
  load(
    realm: Realm,
    filter: string,
    sortBy: string,
    sortOrder: "asce" | "desc"
  ) {
    let objects = realm.objects<PaperEntity>("PaperEntity");
    this.fire({ count: objects.length });

    if (!realm.paperEntityListened) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.fire("updated");
        }
      });
      realm.paperEntityListened = true;
    }

    if (filter) {
      try {
        return objects.filtered(filter).sorted(sortBy, sortOrder === "desc");
      } catch (error) {
        throw new Error(`Invalid filter: ${filter}`);
      }
    } else {
      return objects.sorted(sortBy, sortOrder === "desc");
    }
  }

  /**
   * Load paper entity by id.
   * @param realm - Realm instance.
   * @param ids - Paper ids.
   * @returns - Results of paper entities.
   */
  loadByIds(realm: Realm, ids: OID[]) {
    const idsQuery = ids.map((id) => `oid(${id})`).join(", ");

    let objects = realm
      .objects<PaperEntity>("PaperEntity")
      .filtered(`_id IN { ${idsQuery} }`);

    return objects;
  }

  /**
   * Make sure all properties of paper entity.
   * @param paperEntity - Paper entity.
   * @returns - Paper entity.
   */
  makeSureProperties(paperEntity: IPaperEntityObject) {
    if (!paperEntity._id && !paperEntity.id) {
      paperEntity._id = new ObjectId();
      paperEntity.id = paperEntity._id;
    } else {
      paperEntity._id = new ObjectId(paperEntity._id || paperEntity.id);
      paperEntity.id = new ObjectId(paperEntity.id || paperEntity._id);
    }

    paperEntity._partition = paperEntity._partition || "";
    paperEntity.addTime = paperEntity.addTime || new Date();
    paperEntity.title = `${paperEntity.title}` || "";
    paperEntity.authors = paperEntity.authors || "";
    paperEntity.publication = paperEntity.publication || "";
    paperEntity.pubTime = paperEntity.pubTime || "";
    paperEntity.pubType = paperEntity.pubType || 0;
    paperEntity.doi = paperEntity.doi || "";
    paperEntity.arxiv = paperEntity.arxiv || "";
    paperEntity.mainURL = paperEntity.mainURL || "";
    paperEntity.supURLs = paperEntity.supURLs?.map((url) => `${url}`) || [];
    paperEntity.rating = paperEntity.rating || 0;
    paperEntity.flag = paperEntity.flag || false;
    paperEntity.note = paperEntity.note || "";
    paperEntity.codes = paperEntity.codes?.map((code) => `${code}`) || [];
    paperEntity.pages = paperEntity.pages || "";
    paperEntity.volume = paperEntity.volume || "";
    paperEntity.number = paperEntity.number || "";
    paperEntity.publisher = paperEntity.publisher || "";

    return paperEntity;
  }

  /**
   * Update paper entity.
   * @param realm - Realm instance.
   * @param paperEntity - Paper entity.
   * @param partition - Partition.
   * @param allowUpdate - Allow update flag.
   * @returns - Updated boolean flag.
   */
  update(
    realm: Realm,
    paperEntity: IPaperEntityObject,
    partition: string,
    allowUpdate: boolean = true
  ) {
    paperEntity = this.makeSureProperties(paperEntity);

    return realm.safeWrite(() => {
      const object = this.toRealmObject(realm, paperEntity);

      const tags = paperEntity.tags.map((tag) => {
        const object = this._categorizerRepository.toRealmObject(
          realm,
          CategorizerType.PaperTag,
          tag
        );

        if (object) {
          return object;
        } else {
          return this._categorizerRepository.update(
            realm,
            CategorizerType.PaperTag,
            tag,
            partition
          );
        }
      });

      const folders = paperEntity.folders.map((folder) => {
        const object = this._categorizerRepository.toRealmObject(
          realm,
          CategorizerType.PaperFolder,
          folder
        );

        if (object) {
          return object;
        } else {
          return this._categorizerRepository.update(
            realm,
            CategorizerType.PaperFolder,
            folder,
            partition
          );
        }
      });
      
      if (object) {
        if (!allowUpdate) {
          return false;
        }
        // Update
        const shouldBeUpdatedTags = [...tags, ...object.tags];
        const shouldBeUpdatedFolders = [...folders, ...object.folders];

        object.title = paperEntity.title;
        object.authors = paperEntity.authors;
        object.publication = paperEntity.publication;
        object.pubTime = paperEntity.pubTime;
        object.pubType = paperEntity.pubType;
        object.doi = paperEntity.doi;
        object.arxiv = paperEntity.arxiv;
        object.mainURL = paperEntity.mainURL;
        object.supURLs = Array.from(paperEntity.supURLs);
        object.rating = paperEntity.rating;
        object.flag = paperEntity.flag;
        object.note = paperEntity.note;
        object.codes = Array.from(paperEntity.codes);
        object.volume = paperEntity.volume;
        object.number = paperEntity.number;
        object.pages = paperEntity.pages;
        object.publisher = paperEntity.publisher;
        object.tags = tags;
        object.folders = folders;

        if (partition) {
          object._partition = partition;
        }

        this._categorizerRepository.updateCount(
          realm,
          CategorizerType.PaperTag,
          shouldBeUpdatedTags
        );
        this._categorizerRepository.updateCount(
          realm,
          CategorizerType.PaperFolder,
          shouldBeUpdatedFolders
        );
      } else {
        // Insert
        const shouldBeUpdatedTags = [...tags];
        const shouldBeUpdatedFolders = [...folders];

        paperEntity.tags = [];
        paperEntity.folders = [];
        if (partition) {
          paperEntity._partition = partition;
        }
        const object = realm.create<PaperEntity>("PaperEntity", paperEntity);
        if (object) {
          object.tags = tags;
          object.folders = folders;
        }
        if (partition) {
          object._partition = partition;
        }

        this._categorizerRepository.updateCount(
          realm,
          CategorizerType.PaperTag,
          shouldBeUpdatedTags
        );
        this._categorizerRepository.updateCount(
          realm,
          CategorizerType.PaperFolder,
          shouldBeUpdatedFolders
        );
      }

      return true;
    });
  }

  /**
   * Delete paper entity.
   * @param realm - Realm instance.
   * @param ids - OR Paper ids.
   * @param paperEntity - Paper entity.
   * @returns - Deleted boolean flags.
   */
  delete(realm: Realm, ids?: OID[], paperEntitys?: IPaperEntityCollection) {
    return realm.safeWrite(() => {
      if (paperEntitys) {
        ids = paperEntitys.map(
          (paperEntity: IPaperEntityObject) => paperEntity._id
        );
      }
      if (ids) {
        const idsQuery = ids
          .map((id) => `_id == oid(${id as string})`)
          .join(" OR ");

        const toBeDeleted = realm
          .objects<PaperEntity>("PaperEntity")
          .filtered(`(${idsQuery})`);

        const toBeDeletedFiles = toBeDeleted
          .map((paperEntity) => {
            return [paperEntity.mainURL, ...paperEntity.supURLs];
          })
          .flat();

        const toBeUpdatedTags: ICategorizerCollection = [];
        const toBeUpdatedFolders: ICategorizerCollection = [];

        for (const paperEntity of toBeDeleted) {
          for (const tag of paperEntity.tags) {
            const tagObject = this._categorizerRepository.toRealmObject(
              realm,
              CategorizerType.PaperTag,
              tag
            );
            if (tagObject) {
              toBeUpdatedTags.push(tagObject);
            }
          }
          for (const folder of paperEntity.folders) {
            const folderObject = this._categorizerRepository.toRealmObject(
              realm,
              CategorizerType.PaperFolder,
              folder
            );
            if (folderObject) {
              toBeUpdatedFolders.push(folderObject);
            }
          }
        }

        realm.delete(toBeDeleted);

        this._categorizerRepository.updateCount(
          realm,
          CategorizerType.PaperTag,
          toBeUpdatedTags
        );
        this._categorizerRepository.updateCount(
          realm,
          CategorizerType.PaperFolder,
          toBeUpdatedFolders
        );

        return toBeDeletedFiles;
      } else {
        throw new Error("Either ids or paperEntity should be provided.");
      }
    });
  }
}

export type IPaperEntityRealmObject = PaperEntity &
  Realm.Object<
    PaperEntity,
    | "_id"
    | "title"
    | "authors"
    | "publication"
    | "pubTime"
    | "pubType"
    | "doi"
    | "arxiv"
    | "mainURL"
    | "supURLs"
    | "rating"
    | "flag"
    | "note"
    | "codes"
    | "volume"
    | "number"
    | "pages"
    | "publisher"
    | "tags"
    | "folders"
  >;

export type IPaperEntityObject = PaperEntity | IPaperEntityRealmObject;

export type IPaperEntityCollection =
  | Results<IPaperEntityObject>
  | List<IPaperEntityObject>
  | Array<IPaperEntityObject>;
