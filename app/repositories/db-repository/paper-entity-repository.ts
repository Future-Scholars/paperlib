import { ObjectId } from "bson";
import Realm, { PrimaryKey, Results } from "realm";

import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

export class PaperEntityRepository {
  stateStore: MainRendererStateStore;
  listened: boolean;

  constructor(stateStore: MainRendererStateStore) {
    this.stateStore = stateStore;
    this.listened = false;
  }

  removeListeners() {
    this.listened = false;
  }

  createFilterPattern(
    search: string | null,
    flag: boolean,
    tag: string,
    folder: string
  ): string {
    let filterFormat = "";

    let formatedSearch = formatString({
      str: search,
      removeNewline: true,
      trimWhite: true,
    });

    if (search) {
      if (this.stateStore.viewState.searchMode === "general") {
        const fuzzyFormatedSearch = `*${formatedSearch
          .trim()
          .split(" ")
          .join("*")}*`;
        filterFormat += `(title LIKE[c] \"${fuzzyFormatedSearch}\" OR authors LIKE[c] \"${fuzzyFormatedSearch}\" OR publication LIKE[c] \"${fuzzyFormatedSearch}\" OR note LIKE[c] \"${fuzzyFormatedSearch}\") AND `;
      } else if (this.stateStore.viewState.searchMode === "advanced") {
        // Replace comparison operators for 'addTime'
        const compareDateMatch = formatedSearch.match(
          /(<|<=|>|>=)\s*\[\d+ DAYS\]/g
        );
        if (compareDateMatch) {
          for (const match of compareDateMatch) {
            if (formatedSearch.includes("<")) {
              formatedSearch = formatedSearch.replaceAll(
                match,
                match.replaceAll("<", ">")
              );
            } else if (formatedSearch.includes(">")) {
              formatedSearch = formatedSearch.replaceAll(
                match,
                match.replaceAll(">", "<")
              );
            }
          }
        }

        // Replace Date string
        const dateRegex = /\[\d+ DAYS\]/g;
        const dateMatch = formatedSearch.match(dateRegex);
        if (dateMatch) {
          const date = new Date();
          // replace with date like: 2021-02-20@17:30:15:00
          date.setDate(date.getDate() - parseInt(dateMatch[0].slice(1, -6)));
          formatedSearch = formatedSearch.replace(
            dateRegex,
            date.toISOString().slice(0, -5).replace("T", "@")
          );
        }
        filterFormat += `${formatedSearch} `;
        return filterFormat;
      }
    }

    if (flag) {
      filterFormat += "flag == true AND ";
    }
    if (tag) {
      filterFormat += `(ANY tags.name == \"${tag}\") AND `;
    }
    if (folder) {
      filterFormat += `(ANY folders.name == \"${folder}\") AND `;
    }

    if (filterFormat.length > 0) {
      filterFormat = filterFormat.slice(0, -5);
    }
    return filterFormat;
  }

  // ========================
  // Read
  // ========================
  load(
    realm: Realm,
    search: string,
    flag: boolean,
    tag: string,
    folder: string,
    sortBy: string,
    sortOrder: string
  ) {
    const filterPattern = this.createFilterPattern(search, flag, tag, folder);

    let objects = realm
      .objects<PaperEntity>("PaperEntity")
      .sorted(sortBy, sortOrder == "desc");
    this.stateStore.viewState.entitiesCount = objects.length;

    if (!this.listened) {
      objects.addListener((objs, changes) => {
        const deletionCount = changes.deletions.length;
        const insertionCount = changes.insertions.length;
        const modificationCount =
          changes.newModifications.length + changes.oldModifications.length;

        if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
          this.stateStore.dbState.entitiesUpdated = Date.now();
        }
      });
      this.listened = true;
    }

    if (filterPattern) {
      try {
        objects = objects.filtered(filterPattern);
      } catch (error) {
        window.logger.error(
          "Filter pattern is invalid",
          error as Error,
          true,
          "Search"
        );
      }
    }

    return objects;
  }

  loadByIds(realm: Realm, ids: (ObjectId | string)[]) {
    const idsQuery = ids
      .map((id) => `_id == oid(${id as string})`)
      .join(" OR ");

    let objects = realm
      .objects<PaperEntity>("PaperEntity")
      .filtered(`(${idsQuery})`);

    return objects;
  }

  loadPreprint(realm: Realm) {
    const filterFormat =
      '(publication contains[c] "arXiv") OR (publication contains[c] "openreview") OR publication == ""';
    return realm.objects<PaperEntity>("PaperEntity").filtered(filterFormat);
  }

  // ========================
  // Update
  // ========================
  update(
    realm: Realm,
    paperEntity: PaperEntity,
    paperTag: PaperTag[],
    paperFolder: PaperFolder[],
    existingPaperEntity: PaperEntity | null,
    partition: string
  ) {
    try {
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
    } catch (error) {
      window.logger.error(
        "Failed to update database",
        error as Error,
        true,
        "Database"
      );
      return false;
    }
  }

  // ========================
  // Delete
  // ========================
  delete(realm: Realm, paperEntity?: PaperEntity, ids?: (ObjectId | string)[]) {
    try {
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
    } catch (error) {
      window.logger.error(
        "Failed to delete papers",
        error as Error,
        true,
        "Database"
      );
      return false;
    }
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
