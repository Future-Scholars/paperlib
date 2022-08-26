import Realm, { Results } from "realm";
import { ObjectId } from "bson";

import { PaperEntity } from "../../models/PaperEntity";
import { PaperEntityDraft } from "../../models/PaperEntityDraft";
import { Categorizers, PaperCategorizer } from "../../models/PaperCategorizer";
import { DBRepository } from "./db-repository";
import { formatString } from "../../utils/string";

// ===========================================================
// Read
export async function entitiesByIds(
  this: DBRepository,
  ids: ObjectId[] | string[]
): Promise<PaperEntity[]> {
  const realm = await this.realm();

  const idsQuery = ids.map((id) => `_id == oid(${id as string})`).join(" OR ");

  let entities = realm
    .objects<PaperEntity>("PaperEntity")
    .filtered(`(${idsQuery})`)
    .toJSON() as PaperEntity[];

  entities = entities.map((entity) => {
    entity.id = entity.id.toString();
    entity._id = entity._id.toString();
    return entity;
  });

  return entities;
}

export function createFilterPattern(
  this: DBRepository,
  search: string | null,
  flag: boolean,
  tag: string,
  folder: string
): string {
  let filterFormat = "";

  const formatedSearch = formatString({
    str: search,
    removeNewline: true,
    trimWhite: true,
  });

  if (search) {
    if (this.sharedState.viewState.searchMode.get() === "general") {
      filterFormat += `(title contains[c] \"${formatedSearch}\" OR authors contains[c] \"${formatedSearch}\" OR publication contains[c] \"${formatedSearch}\" OR note contains[c] \"${formatedSearch}\") AND `;
    } else if (this.sharedState.viewState.searchMode.get() === "advanced") {
      filterFormat += `(${formatedSearch}) AND `;
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

export async function entities(
  this: DBRepository,
  search: string | null,
  flag: boolean,
  tag: string,
  folder: string,
  sortBy: string,
  sortOrder: string
): Promise<PaperEntity[]> {
  const filterPattern = this.createFilterPattern(search, flag, tag, folder);

  const realm = await this.realm();
  const objects = realm
    .objects("PaperEntity")
    .sorted(sortBy, sortOrder == "desc");

  this.sharedState.set("viewState.entitiesCount", objects.length);

  if (!this.entitiesListenerInited) {
    objects.addListener((objs, changes) => {
      const deletionCount = changes.deletions.length;
      const insertionCount = changes.insertions.length;
      const modificationCount =
        changes.newModifications.length + changes.oldModifications.length;

      if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
        this.sharedState.set("dbState.entitiesUpdated", Date.now());
      }
    });
    this.entitiesListenerInited = true;
  }

  if (filterPattern) {
    let entities;
    try {
      entities = objects.filtered(filterPattern).toJSON() as PaperEntity[];
    } catch (error) {
      console.log(error);
      this.sharedState.set(
        "viewState.alertInformation",
        `Filter pattern is invalid: ${error as string}`
      );
      entities = objects.toJSON() as PaperEntity[];
    }
    entities = entities.map((entity) => {
      entity.id = entity.id.toString();
      entity._id = entity._id.toString();
      return entity;
    });
    return entities;
  } else {
    let entities = objects.toJSON() as PaperEntity[];
    entities = entities.map((entity) => {
      entity.id = entity.id.toString();
      entity._id = entity._id.toString();
      return entity;
    });
    return entities;
  }
}

export async function categorizers(
  this: DBRepository,
  categorizerType: Categorizers,
  sortBy: string,
  sortOrder: string
): Promise<PaperCategorizer[]> {
  const realm = await this.realm();
  const objects = realm
    .objects(categorizerType)
    .sorted(sortBy, sortOrder == "desc");

  if (!this.categorizersListenerInited[categorizerType]) {
    objects.addListener((objs, changes) => {
      const deletionCount = changes.deletions.length;
      const insertionCount = changes.insertions.length;
      const modificationCount =
        changes.newModifications.length + changes.oldModifications.length;

      let statePath;
      if (categorizerType === "PaperTag") {
        statePath = "dbState.tagsUpdated";
      } else if (categorizerType === "PaperFolder") {
        statePath = "dbState.foldersUpdated";
      } else {
        throw new Error(
          `Unknown categorizer type: ${categorizerType as string}`
        );
      }
      if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
        this.sharedState.set(statePath, Date.now());
      }
    });
    this.categorizersListenerInited[categorizerType] = true;
  }
  return objects.toJSON() as PaperCategorizer[];
}

export async function preprintEntities(
  this: DBRepository
): Promise<PaperEntity[]> {
  const realm = await this.realm();

  const filterFormat =
    'publication contains[c] "arXiv" OR publication contains[c] "openreview"';
  return realm
    .objects("PaperEntity")
    .filtered(filterFormat)
    .toJSON() as PaperEntity[];
}

// ============================================================
// Delete
export async function remove(this: DBRepository, ids: string[]) {
  const realm = await this.realm();

  const idsQuery = ids.map((id) => `_id == oid(${id})`).join(" OR ");

  const entities = realm
    .objects<PaperEntity>("PaperEntity")
    .filtered(`(${idsQuery})`);
  const removeFileURLs: string[] = [];
  try {
    realm.safeWrite(() => {
      for (const entity of entities) {
        removeFileURLs.push(entity.mainURL);
        removeFileURLs.push(...entity.supURLs);

        this.deleteCategorizers(
          entity.tags.map((tag) => tag.name).join(";"),
          "PaperTag",
          false,
          realm
        );
        this.deleteCategorizers(
          entity.folders.map((folder) => folder.name).join(";"),
          "PaperFolder",
          false,
          realm
        );
      }
      realm.delete(entities);
    });
    return removeFileURLs;
  } catch (error) {
    this.sharedState.set(
      "viewState.alertInformation",
      `Error deleting entities: ${error as string}`
    );
    return [];
  }
}

export async function deleteCategorizers(
  this: DBRepository,
  categorizerNameStr: string,
  categorizerType: Categorizers,
  deleteAll = true,
  realm: Realm | null = null
) {
  if (!realm) {
    realm = await this.realm();
  }

  realm.safeWrite(() => {
    categorizerNameStr.split(";").forEach((categorizerName) => {
      const objects = realm!
        .objects<PaperCategorizer>(categorizerType)
        .filtered(`name == "${categorizerName}"`) as Results<PaperCategorizer>;
      if (deleteAll) {
        realm!.delete(objects);
      } else {
        for (const object of objects) {
          object.count -= 1;
          if (object.count <= 0) {
            realm!.delete(object);
          }
        }
      }
    });
  });
}

export async function colorizeCategorizers(
  this: DBRepository,
  categorizerNameStr: string,
  categorizerType: Categorizers,
  color: string,
  realm: Realm | null = null
) {
  if (!realm) {
    realm = await this.realm();
  }

  realm.safeWrite(() => {
    categorizerNameStr.split(";").forEach((categorizerName) => {
      const objects = realm!
        .objects<PaperCategorizer>(categorizerType)
        .filtered(`name == "${categorizerName}"`) as Results<PaperCategorizer>;
      for (const object of objects) {
        object.color = color;
      }
    });
  });
}

export async function renameCategorizer(
  this: DBRepository,
  oldCategorizerNameStr: string,
  newCategorizerNameStr: string,
  categorizerType: Categorizers,
  realm: Realm | null = null
) {
  if (!realm) {
    realm = await this.realm();
  }

  const existingObjects = realm!
    .objects<PaperCategorizer>(categorizerType)
    .filtered(
      `name == "${newCategorizerNameStr}"`
    ) as Results<PaperCategorizer>;

  if (existingObjects.length > 0) {
    this.sharedState.set(
      "viewState.alertInformation",
      `Categorizer ${newCategorizerNameStr} already exists`
    );
    return false;
  }

  try {
    realm.safeWrite(() => {
      const objects = realm!
        .objects<PaperCategorizer>(categorizerType)
        .filtered(
          `name == "${oldCategorizerNameStr}"`
        ) as Results<PaperCategorizer>;

      for (const object of objects) {
        object.name = newCategorizerNameStr;
      }
    });
    return true;
  } catch (error) {
    this.sharedState.set(
      "viewState.alertInformation",
      `Error renaming categorizer: ${error as string}`
    );
    return false;
  }
}

export function updateCategorizers(
  this: DBRepository,
  existCategorizers: PaperCategorizer[],
  updatedCategorizersStr: string,
  categorizerType: Categorizers,
  realm: Realm
) {
  let updateCategorizerNameList = updatedCategorizersStr.split(";");
  updateCategorizerNameList = updateCategorizerNameList
    .map((categorizerName) => {
      return formatString({
        str: categorizerName,
        removeWhite: true,
        trimWhite: true,
      });
    })
    .filter((categorizerName) => {
      return categorizerName !== "";
    });

  const existCategorizerNameList = existCategorizers.map((categorizer) => {
    return categorizer.name;
  });

  // Remove categorizer that is not in updated categorizers
  for (const existCategorizer of existCategorizers) {
    if (!updateCategorizerNameList.includes(existCategorizer.name)) {
      existCategorizer.count -= 1;
      if (existCategorizer.count <= 0) {
        realm.delete(existCategorizer);
      }
    }
  }

  let updatedCategorizers = [];
  // Add categorizer that is not in exist categorizers
  for (const updateCategorizerName of updateCategorizerNameList) {
    const dbExistCategorizers = realm
      .objects(categorizerType)
      .filtered(`name == "${updateCategorizerName}"`)
      .toJSON() as PaperCategorizer[];

    if (!existCategorizerNameList.includes(updateCategorizerName)) {
      if (dbExistCategorizers.length > 0) {
        const categorizer = dbExistCategorizers[0];
        categorizer.count += 1;
        updatedCategorizers.push(categorizer);
      } else {
        const categorizer = {
          _id: new ObjectId(),
          name: updateCategorizerName,
          count: 1,
          _partition: "",
          color: "blue",
        };
        if (this.cloudConfig && this.app && this.app.currentUser) {
          categorizer["_partition"] = this.app.currentUser.id.toString();
        }
        realm.create(categorizerType, categorizer);
        updatedCategorizers.push(categorizer);
      }
    } else {
      updatedCategorizers.push(dbExistCategorizers[0]);
    }
  }

  return updatedCategorizers;
}

// ============================================================
// Update & Add
export async function update(
  this: DBRepository,
  entities: PaperEntityDraft[]
): Promise<boolean[]> {
  const realm = await this.realm();

  const successes: boolean[] = [];

  realm.safeWrite(() => {
    for (const entity of entities) {
      let existingObj: PaperEntity | null;
      if (entity._id) {
        existingObj = realm.objectForPrimaryKey(
          "PaperEntity",
          new Realm.BSON.ObjectId(entity._id)
        ) as PaperEntity;
      } else {
        existingObj = null;
      }
      if (existingObj) {
        // Update
        const updateObj = existingObj as unknown as PaperEntity;
        updateObj.title = entity.title;
        updateObj.authors = entity.authors;
        updateObj.publication = entity.publication;
        updateObj.pubTime = entity.pubTime;
        updateObj.pubType = entity.pubType;
        updateObj.doi = entity.doi;
        updateObj.arxiv = entity.arxiv;
        updateObj.mainURL = entity.mainURL;
        updateObj.supURLs = entity.supURLs;
        updateObj.rating = entity.rating;
        updateObj.flag = entity.flag;
        updateObj.note = entity.note;
        updateObj.codes = entity.codes;
        updateObj.volume = entity.volume;
        updateObj.number = entity.number;
        updateObj.pages = entity.pages;
        updateObj.publisher = entity.publisher;
        updateObj.tags = this.updateCategorizers(
          updateObj.tags,
          entity.tags,
          "PaperTag",
          realm
        );
        updateObj.folders = this.updateCategorizers(
          updateObj.folders,
          entity.folders,
          "PaperFolder",
          realm
        );
        successes.push(true);
      } else {
        // Add
        const reduplicatedEntities = realm
          .objects("PaperEntity")
          .filtered(
            "title == $0 and authors == $1",
            entity.title,
            entity.authors
          );
        if (reduplicatedEntities.length > 0) {
          continue;
        }

        if (this.cloudConfig && this.app && this.app.currentUser) {
          entity._partition = this.app.currentUser.id.toString();
        }
        const newObj = entity.create();
        realm.create("PaperEntity", newObj);

        existingObj = realm.objectForPrimaryKey(
          "PaperEntity",
          new Realm.BSON.ObjectId(newObj._id)
        ) as PaperEntity;
        existingObj.tags = this.updateCategorizers(
          existingObj.tags,
          entity.tags,
          "PaperTag",
          realm
        );
        existingObj.folders = this.updateCategorizers(
          existingObj.folders,
          entity.folders,
          "PaperFolder",
          realm
        );

        successes.push(true);
      }
    }
  });
  return successes;
}
