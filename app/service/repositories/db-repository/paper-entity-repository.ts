import { ObjectId } from "bson";
import Realm from "realm";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { CategorizerType, ICategorizerCollection } from "@/models/categorizer";
import { OID } from "@/models/id";
import { IEntityCollection, IEntityObject, IEntityRealmObject, Entity } from "@/models/entity";
import { ILogService, LogService } from "@/common/services/log-service";
import {
  CategorizerRepository,
  ICategorizerRepository,
} from "./categorizer-repository";

import { deleteSqliteEntity, toSqliteEntity } from "@/service/services/sync/sqlite-pollyfill";

export interface IPaperEntityRepositoryState {
  count: number;
  updated: number;
}

export const IPaperEntityRepository = createDecorator("paperEntityRepository");

export class PaperEntityRepository extends Eventable<IPaperEntityRepositoryState> {
  constructor(
    @ICategorizerRepository
    private readonly _categorizerRepository: CategorizerRepository,
    @ILogService
    private readonly _logService: LogService,
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
  toRealmObject(realm: Realm, paperEntity: IEntityObject) {
    if (paperEntity instanceof Realm.Object) {
      return paperEntity as IEntityRealmObject;
    } else {
      const objects = realm
        .objects<Entity>("Entity")
        .filtered(`_id == oid(${paperEntity._id})`);

      if (objects.length > 0) {
        return objects[0] as IEntityRealmObject;
      } else {
        const reduplicatedObjects = realm
          .objects<Entity>("Entity")
          .filtered(
            "title == $0 and authors == $1",
            paperEntity.title,
            paperEntity.authors
          );
        if (reduplicatedObjects.length > 0) {
          return reduplicatedObjects[0] as IEntityRealmObject;
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
    let objects = realm.objects<Entity>("Entity");
    this.fire({ count: objects.length });

    if (!realm.entityListened) {
      objects.addListener((objs, changes) => {
        // TODO: shall we check the library of objects?
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.fire("updated");
        }
      })

      realm.entityListened = true;
    }
    objects = objects.filtered("library == 'main'");
    if (filter) {
      try {
        objects = objects.filtered(`(${filter})`).sorted(sortBy, sortOrder === "desc");
      } catch (error) {
        throw new Error(`Invalid filter: ${filter}`);
      }
    }

    // Write to sqlite database if not exists
    objects.forEach(async (object) => {
      await toSqliteEntity(object, this._logService);
    });
    
    return objects.sorted(sortBy, sortOrder === "desc");
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
      .objects<Entity>("Entity")
      .filtered(`_id IN { ${idsQuery} }`);

    return objects;
  }

  /**
   * Make sure all properties of paper entity.
   * @param paperEntity - Paper entity.
   * @returns - Paper entity.
   */
  makeSureProperties(paperEntity: IEntityObject) {
    if (!paperEntity._id) {
      paperEntity._id = new ObjectId();
    } else {
      paperEntity._id = new ObjectId(paperEntity._id);
    }

    paperEntity.addTime = paperEntity.addTime || new Date();
    paperEntity.library = "main";
    paperEntity.type = paperEntity.type || "article";
    paperEntity.supplementaries = paperEntity.supplementaries || [];
    paperEntity.title = `${paperEntity.title}` || "";
    paperEntity.authors = paperEntity.authors || "";
    paperEntity.year = paperEntity.year || "";
    paperEntity.rating = paperEntity.rating || 0;
    paperEntity.tags = paperEntity.tags || [];
    paperEntity.folders = paperEntity.folders || [];
    paperEntity.flag = paperEntity.flag || false;

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
    paperEntity: IEntityObject,
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

      // sync changes to sqlite database
      // It's not needed to sync changes to sqlite database here as the changes will be synced to sqlite database when the entity is loaded
      // toSqliteEntity(paperEntity, this._logService);

      if (object) {
        if (!allowUpdate) {
          return false;
        }
        // Update
        const shouldBeUpdatedTags = [...tags, ...object.tags];
        const shouldBeUpdatedFolders = [...folders, ...object.folders];

        object.library = paperEntity.library;
        object.type = paperEntity.type;
        object.abstract = paperEntity.abstract;
        object.defaultSup = paperEntity.defaultSup;
        object.supplementaries = paperEntity.supplementaries;
        object.doi = paperEntity.doi;
        object.arxiv = paperEntity.arxiv;
        object.issn = paperEntity.issn;
        object.isbn = paperEntity.isbn;

        object.title = paperEntity.title;
        object.authors = paperEntity.authors;
        object.journal = paperEntity.journal;
        object.booktitle = paperEntity.booktitle;
        object.year = paperEntity.year;
        object.month = paperEntity.month;
        object.volume = paperEntity.volume;
        object.number = paperEntity.number;
        object.pages = paperEntity.pages;
        object.publisher = paperEntity.publisher;
        object.series = paperEntity.series;
        object.edition = paperEntity.edition;
        object.editor = paperEntity.editor;
        object.howpublished = paperEntity.howpublished;
        object.organization = paperEntity.organization;
        object.school = paperEntity.school;
        object.institution = paperEntity.institution;

        object.rating = paperEntity.rating;
        object.tags = tags;
        object.folders = folders;
        object.flag = paperEntity.flag;
        object.note = paperEntity.note;

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
        const object = realm.create<Entity>("Entity", paperEntity);
        if (object) {
          object.tags = tags;
          object.folders = folders;
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
  delete(realm: Realm, ids?: OID[], paperEntitys?: IEntityCollection) {
    return realm.safeWrite(() => {
      if (paperEntitys) {
        ids = paperEntitys.map(
          (paperEntity: IEntityObject) => paperEntity._id
        );
      }
      if (ids) {
        const idsQuery = ids
          .map((id) => `_id == oid(${id as string})`)
          .join(" OR ");

        const toBeDeleted = realm
          .objects<Entity>("Entity")
          .filtered(`(${idsQuery})`);

        const toBeDeletedFiles = toBeDeleted
          .map((paperEntity) => {
            return Object.values(paperEntity.supplementaries).map(sup => sup.url).filter((url) => url?.startsWith("file://")) as string[];
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

        // sync changes to sqlite database
        toBeDeleted.forEach(async (paperEntity) => {
          await deleteSqliteEntity(paperEntity);
        });

        return toBeDeletedFiles;
      } else {
        throw new Error("Either ids or paperEntity should be provided.");
      }
    });
  }
}
