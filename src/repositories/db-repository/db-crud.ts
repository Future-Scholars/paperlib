import Realm, { Results } from 'realm';
import { ObjectId } from 'bson';

import { PaperEntity } from '../../models/PaperEntity';
import { PaperEntityDraft } from '../../models/PaperEntityDraft';
import {
  CategorizerType,
  PaperCategorizer,
} from '../../models/PaperCategorizer';
import { DBRepository } from './db-repository';
import { formatString } from '../../utils/string';

// ===========================================================
// Read
export async function entitiesByIds(
  this: DBRepository,
  ids: ObjectId[] | string[]
): Promise<PaperEntity[]> {
  const realm = await this.realm();

  const idsQuery = ids.map((id) => `_id == oid(${id as string})`).join(' OR ');

  let entities = realm
    .objects<PaperEntity>('PaperEntity')
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
  let filterFormat = '';

  const formatedSearch = formatString({
    str: search,
    removeNewline: true,
    trimWhite: true,
  });

  if (search) {
    if (this.sharedState.viewState.searchMode.value === 'general') {
      filterFormat += `(title contains[c] \"${formatedSearch}\" OR authors contains[c] \"${formatedSearch}\" OR publication contains[c] \"${formatedSearch}\" OR note contains[c] \"${formatedSearch}\") AND `;
    } else if (this.sharedState.viewState.searchMode.value === 'advanced') {
      filterFormat += `(${formatedSearch}) AND `;
    }
  }
  if (flag) {
    filterFormat += 'flag == true AND ';
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
    .objects('PaperEntity')
    .sorted(sortBy, sortOrder == 'desc');

  this.sharedState.set('viewState.entitiesCount', objects.length);

  if (!this.entitiesListenerInited) {
    objects.addListener((objs, changes) => {
      const deletionCount = changes.deletions.length;
      const insertionCount = changes.insertions.length;
      const modificationCount =
        changes.newModifications.length + changes.oldModifications.length;

      if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
        this.sharedState.set('dbState.entitiesUpdated', new Date().getTime());
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
        'viewState.alertInformation',
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
  categorizerType: CategorizerType
): Promise<PaperCategorizer[]> {
  const realm = await this.realm();
  const objects = realm.objects(categorizerType).sorted('name');

  if (!this.categorizersListenerInited[categorizerType]) {
    objects.addListener((objs, changes) => {
      const deletionCount = changes.deletions.length;
      const insertionCount = changes.insertions.length;
      const modificationCount =
        changes.newModifications.length + changes.oldModifications.length;

      let statePath;
      if (categorizerType === 'PaperTag') {
        statePath = 'dbState.tagsUpdated';
      } else if (categorizerType === 'PaperFolder') {
        statePath = 'dbState.foldersUpdated';
      } else {
        throw new Error(
          `Unknown categorizer type: ${categorizerType as string}`
        );
      }
      if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
        this.sharedState.set(statePath, new Date().getTime());
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

  const filterFormat = 'publication contains[c] "arXiv"';
  return realm
    .objects('PaperEntity')
    .filtered(filterFormat)
    .toJSON() as PaperEntity[];
}

// ============================================================
// Delete
export async function remove(this: DBRepository, ids: string[]) {
  const realm = await this.realm();

  const idsQuery = ids.map((id) => `_id == oid(${id})`).join(' OR ');

  const entities = realm
    .objects<PaperEntity>('PaperEntity')
    .filtered(`(${idsQuery})`);
  const removeFileURLs: string[] = [];
  try {
    realm.write(() => {
      for (const entity of entities) {
        removeFileURLs.push(entity.mainURL);
        removeFileURLs.push(...entity.supURLs);

        this.unlinkCategorizers(entity.tags, realm);
        this.unlinkCategorizers(entity.folders, realm);
      }
      realm.delete(entities);
    });
    return removeFileURLs;
  } catch (error) {
    this.sharedState.set(
      'viewState.alertInformation',
      `Error deleting entities: ${error as string}`
    );
    return [];
  }
}

export async function deleteCategorizers(
  this: DBRepository,
  categorizerName: string,
  categorizerType: CategorizerType
) {
  const realm = await this.realm();

  realm.write(() => {
    const objects = realm
      .objects(categorizerType)
      .filtered(`name == "${categorizerName}"`);
    realm.delete(objects);
  });
}

export function unlinkCategorizers(
  this: DBRepository,
  categorizers: PaperCategorizer[],
  realm: Realm
) {
  categorizers.forEach((categorizer) => {
    categorizer.count -= 1;
    if (categorizer.count <= 0) {
      realm.delete(categorizer);
    }
  });
}

export function linkCategorizers(
  this: DBRepository,
  categorizerStrs: string,
  realm: Realm,
  categorizerType: CategorizerType
): PaperCategorizer[] {
  const categorizers = [];
  const categorizerNameList = new Set(categorizerStrs.split(';'));
  for (const _categorizerName of categorizerNameList) {
    const categorizerName = formatString({
      str: _categorizerName,
      removeWhite: true,
      trimWhite: true,
    });
    if (categorizerName === '') {
      continue;
    }

    const existCategorizers = realm
      .objects(categorizerType)
      .filtered(`name == "${categorizerName}"`)
      .toJSON() as PaperCategorizer[];

    if (existCategorizers.length > 0) {
      const categorizer = existCategorizers[0];
      categorizer.count += 1;
      categorizers.push(categorizer);
    } else {
      const categorizer = {
        _id: new ObjectId(),
        name: categorizerName,
        count: 1,
        _partition: '',
      };
      if (this.cloudConfig && this.app && this.app.currentUser) {
        categorizer['_partition'] = this.app.currentUser.id.toString();
      }
      realm.create(categorizerType, categorizer);
      categorizers.push(categorizer);
    }
  }
  return categorizers;
}

// ============================================================
// Update & Add
export async function update(
  this: DBRepository,
  entities: PaperEntityDraft[]
): Promise<boolean[]> {
  const realm = await this.realm();

  const successes: boolean[] = [];

  realm.write(() => {
    for (const entity of entities) {
      let existingObj: PaperEntity | null;
      if (entity._id) {
        existingObj = realm.objectForPrimaryKey(
          'PaperEntity',
          new ObjectId(entity._id)
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

        // remove old tags
        this.unlinkCategorizers(updateObj.tags as PaperCategorizer[], realm);
        // add new tags
        updateObj.tags = this.linkCategorizers(entity.tags, realm, 'PaperTag');
        // remove old folders
        this.unlinkCategorizers(updateObj.folders, realm);
        // add new folders
        updateObj.folders = this.linkCategorizers(
          entity.folders,
          realm,
          'PaperFolder'
        );
        successes.push(true);
      } else {
        // Add
        const reduplicatedEntities = realm
          .objects('PaperEntity')
          .filtered(
            `title == \"${entity.title}\" and authors == \"${entity.authors}\"`
          );
        if (reduplicatedEntities.length > 0) {
          continue;
        }

        if (this.cloudConfig && this.app && this.app.currentUser) {
          entity._partition = this.app.currentUser.id.toString();
        }
        const newObj = entity.create();
        if (entity.tags) {
          newObj.tags = this.linkCategorizers(entity.tags, realm, 'PaperTag');
        }
        if (entity.folders) {
          newObj.folders = this.linkCategorizers(
            entity.folders,
            realm,
            'PaperFolder'
          );
        }

        realm.create('PaperEntity', newObj);
        successes.push(true);
      }
    }
  });
  return successes;
}
