import { ObjectId } from "bson";
import Realm, { PrimaryKey, Results } from "realm";

import { Eventable } from "@/base/event";
import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";

export interface IPaperEntityRepositoryState {
  count: number;
  updated: number;
}

export class PaperEntityRepository extends Eventable<IPaperEntityRepositoryState> {
  private _listened: boolean;

  // TODO: repository should not access services such as log service. Just throw error.
  constructor() {
    super("PaperEntityRepository", {
      count: 0,
      updated: 0,
    });
    this._listened = false;
  }

  removeListeners() {
    // TODO: where to use this?
    this._listened = false;
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

    if (!this._listened) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.fire("updated");
        }
      });
      this._listened = true;
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
  loadByIds(realm: Realm, ids: (ObjectId | string)[]) {
    const idsQuery = ids
      .map((id) => `_id == oid(${id as string})`)
      .join(" OR ");

    let objects = realm
      .objects<PaperEntity>("PaperEntity")
      .filtered(`(${idsQuery})`);

    return objects;
  }

  //TODO: preprint should implement in the db service

  /**
   * Update paper entity.
   * @param realm - Realm instance.
   * @param paperEntity - Paper entity.
   * @param paperTag - Paper tags.
   * @param paperFolder - Paper folders.
   * @param existingPaperEntity - Existing paper entity.
   * @param partition - Partition.
   * @returns - Updated boolean flag.
   */
  update(
    realm: Realm,
    paperEntity: PaperEntity,
    paperTag: PaperTag[],
    paperFolder: PaperFolder[],
    existingPaperEntity: PaperEntity | null,
    partition: string
  ) {
    return realm.safeWrite(() => {
      if (existingPaperEntity) {
        // Update
        const updateObj = existingPaperEntity;
        updateObj.title = paperEntity.title;
        updateObj.authors = paperEntity.authors;
        updateObj.publication = paperEntity.publication;
        updateObj.pubTime = paperEntity.pubTime;
        updateObj.pubType = paperEntity.pubType;
        updateObj.doi = paperEntity.doi;
        updateObj.arxiv = paperEntity.arxiv;
        updateObj.mainURL = paperEntity.mainURL;
        updateObj.supURLs = paperEntity.supURLs;
        updateObj.rating = paperEntity.rating;
        updateObj.flag = paperEntity.flag;
        updateObj.note = paperEntity.note;
        updateObj.codes = paperEntity.codes;
        updateObj.volume = paperEntity.volume;
        updateObj.number = paperEntity.number;
        updateObj.pages = paperEntity.pages;
        updateObj.publisher = paperEntity.publisher;
        updateObj.tags = paperTag;
        updateObj.folders = paperFolder;
      } else {
        // Add
        const reduplicatedEntities = realm
          .objects<PaperEntity>("PaperEntity")
          .filtered(
            "title == $0 and authors == $1",
            paperEntity.title,
            paperEntity.authors
          );
        if (reduplicatedEntities.length === 0) {
          paperEntity.tags = [];
          paperEntity.folders = [];
          if (partition) {
            paperEntity._partition = partition;
          }
          realm.create("PaperEntity", paperEntity);

          const addedObj = realm.objectForPrimaryKey<PaperEntity>(
            "PaperEntity",
            new Realm.BSON.ObjectId(paperEntity._id)
          );
          if (addedObj) {
            addedObj.tags = paperTag;
            addedObj.folders = paperFolder;
          }
        } else {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Delete paper entity.
   * @param realm - Realm instance.
   * @param ids - OR Paper ids.
   * @param paperEntity - Paper entity.
   * @returns - Deleted boolean flag.
   */
  delete(realm: Realm, ids?: (ObjectId | string)[], paperEntity?: PaperEntity) {
    return realm.safeWrite(() => {
      if (paperEntity) {
        realm.delete(paperEntity);
        return true;
      } else if (ids) {
        const idsQuery = ids
          .map((id) => `_id == oid(${id as string})`)
          .join(" OR ");
        realm.delete(
          realm.objects<PaperEntity>("PaperEntity").filtered(`(${idsQuery})`)
        );
        return true;
      } else {
        throw new Error("No paper entity or ids are given");
      }
    });
  }

  // ==============================
  // Dev Functions
  // ==============================

  removeAll(realm: Realm) {
    const objects = realm.objects<PaperEntity>("PaperEntity");
    realm.safeWrite(() => {
      realm.delete(objects);
    });
  }

  addDummyData(
    tag: PaperTag,
    folder: PaperFolder,
    realm: Realm,
    partition: string
  ) {
    const ids: Array<string | ObjectId> = [];
    realm.safeWrite(() => {
      for (let i = 0; i < 10000; i++) {
        const entity = new PaperEntity(true);
        entity._partition = partition;

        entity.dummyFill();

        realm.create("PaperEntity", entity);

        if (i % 500 === 0) {
          ids.push(entity.id);
        }
      }

      for (const id of ids) {
        const createdEntity = realm.objectForPrimaryKey<PaperEntity>(
          "PaperEntity",
          id as PrimaryKey
        );
        const tagObj = realm.objectForPrimaryKey<PaperTag>(
          "PaperTag",
          tag._id as PrimaryKey
        );
        const folderObj = realm.objectForPrimaryKey<PaperFolder>(
          "PaperFolder",
          folder._id as PrimaryKey
        );
        if (createdEntity && tagObj && folderObj) {
          tagObj.count += 1;
          folderObj.count += 1;
          createdEntity.tags.push(tagObj);
          createdEntity.folders.push(folderObj);
        }
      }
    });
  }
}

export type IPaperEntityResults =
  | Results<PaperEntity & Realm.Object>
  | Array<PaperEntity>;
