// @ts-nocheck
import { DBRepository } from './db-repository';
import { PaperEntityDraft } from '../../models/PaperEntityDraft';
import { PaperEntity } from 'src/models/PaperEntity';

/* eslint-disable */
export function migrate(oldRealm, newRealm) {
  // only apply this change if upgrading to schemaVersion 2
  if (oldRealm.schemaVersion == 1) {
    const oldObjects = oldRealm.objects('PaperEntity');
    const newObjects = newRealm.objects('PaperEntity');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldObjects) {
      const oldObject = oldObjects[objectIndex];
      const newObject = newObjects[objectIndex];
      newObject['title'] = oldObject['title'] ? oldObject['title'] : '';
      newObject['authors'] = oldObject['authors'] ? oldObject['authors'] : '';
      newObject['publication'] = oldObject['publication']
        ? oldObject['publication']
        : '';
      newObject['pubTime'] = oldObject['pubTime'] ? oldObject['pubTime'] : '';
      newObject['pubType'] = oldObject['pubType'] ? oldObject['pubType'] : 2;
      newObject['note'] = oldObject['note'] ? oldObject['note'] : '';
      newObject['doi'] = oldObject['doi'] ? oldObject['doi'] : '';
      newObject['arxiv'] = oldObject['arxiv'] ? oldObject['arxiv'] : '';
      newObject['rating'] = oldObject['rating'] ? oldObject['rating'] : 0;
      newObject['flag'] = oldObject['flag'] ? oldObject['flag'] : false;
      newObject['mainURL'] = path.basename(
        oldObject['mainURL'] ? oldObject['mainURL'] : ''
      );
      const newObjectSupURLs = [];
      for (const supURL of newObject['supURLs']) {
        newObjectSupURLs.push(path.basename(supURL));
      }
      newObject['supURLs'] = newObjectSupURLs;
      newObject['_id'] = oldObject['id'];
    }

    const oldTags = oldRealm.objects('PaperTag');
    const newTags = newRealm.objects('PaperTag');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldTags) {
      const oldTag = oldTags[objectIndex];
      const newTag = newTags[objectIndex];
      newTag['_id'] = new ObjectId();
    }

    const oldFolders = oldRealm.objects('PaperFolder');
    const newFolders = newRealm.objects('PaperFolder');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldFolders) {
      const oldFolder = oldFolders[objectIndex];
      const newFolder = newFolders[objectIndex];
      newFolder['_id'] = new ObjectId();
    }
  }

  if (oldRealm.schemaVersion == 2) {
    const newObjects = newRealm.objects('PaperEntity');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in newObjects) {
      const newObject = newObjects[objectIndex];

      newObject['mainURL'] = path.basename(newObject['mainURL']);
      const newObjectSupURLs = [];
      for (const supURL of newObject['supURLs']) {
        newObjectSupURLs.push(path.basename(supURL));
      }
      newObject['supURLs'] = newObjectSupURLs;
      newObject['_id'] = oldObject['id'];
    }

    const oldTags = oldRealm.objects('PaperTag');
    const newTags = newRealm.objects('PaperTag');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldTags) {
      const oldTag = oldTags[objectIndex];
      const newTag = newTags[objectIndex];
      newTag['_id'] = new ObjectId();
    }

    const oldFolders = oldRealm.objects('PaperFolder');
    const newFolders = newRealm.objects('PaperFolder');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldFolders) {
      const oldFolder = oldFolders[objectIndex];
      const newFolder = newFolders[objectIndex];
      newFolder['_id'] = new ObjectId();
    }
  }

  if (oldRealm.schemaVersion == 3) {
    const oldObjects = oldRealm.objects('PaperEntity');
    const newObjects = newRealm.objects('PaperEntity');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldObjects) {
      const oldObject = oldObjects[objectIndex];
      const newObject = newObjects[objectIndex];
      newObject['_id'] = oldObject['id'];
    }

    const oldTags = oldRealm.objects('PaperTag');
    const newTags = newRealm.objects('PaperTag');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldTags) {
      const oldTag = oldTags[objectIndex];
      const newTag = newTags[objectIndex];
      newTag['_id'] = new ObjectId();
    }

    const oldFolders = oldRealm.objects('PaperFolder');
    const newFolders = newRealm.objects('PaperFolder');
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldFolders) {
      const oldFolder = oldFolders[objectIndex];
      const newFolder = newFolders[objectIndex];
      newFolder['_id'] = new ObjectId();
    }
  }

  if (oldRealm.schemaVersion == 4) {
    const oldTags = oldRealm.objects('PaperTag');
    const newTags = newRealm.objects('PaperTag');
    for (const objectIndex in oldTags) {
      const newTag = newTags[objectIndex];
      newTag['_id'] = new ObjectId();
    }

    const oldFolders = oldRealm.objects('PaperFolder');
    const newFolders = newRealm.objects('PaperFolder');
    for (const objectIndex in oldFolders) {
      const newFolder = newFolders[objectIndex];
      newFolder['_id'] = new ObjectId();
    }
  }

  if (oldRealm.schemaVersion == 5) {
    const newEntities = newRealm.objects('PaperEntity');
    for (const objectIndex in newEntities) {
      const newEntity = newEntities[objectIndex];
      newEntity['codes'] = [];
    }
  }
}
/* eslint-enable */

export async function migrateLocaltoCloud(this: DBRepository) {
  try {
    const localConfig = this.getLocalConfig();
    const localRealm = new Realm(localConfig);

    const entities = localRealm
      .objects('PaperEntity')
      .toJSON() as PaperEntity[];
    const entityDraftsWithCategorizer = entities.map((entity) => {
      entity.id = entity.id.toString();
      entity._id = entity.id.toString();
      const draft = new PaperEntityDraft();
      draft.initialize(entity);
      return draft;
    });

    const entityDraftsWithoutCategorizer = entities.map((entity) => {
      entity.id = entity.id.toString();
      entity._id = entity.id.toString();
      const draft = new PaperEntityDraft();
      draft.initialize(entity);
      draft.tags = '';
      draft.folders = '';
      return draft;
    });

    await this.update(entityDraftsWithoutCategorizer);
    await this.update(entityDraftsWithCategorizer);
  } catch (error) {
    this.sharedState.set(
      'viewState.alertInformation',
      `Migrate local to sync faild: ${error as string}`
    );
  }
}
