import { ObjectId } from "bson";
import path from "path";
import Realm from "realm";

import { PaperEntity } from "@/models/paper-entity";

export function migrate(oldRealm: Realm, newRealm: Realm) {
  const oldVersion = oldRealm.schemaVersion;
  // only apply this change if upgrading to schemaVersion 2
  if (oldVersion <= 1) {
    const oldObjects = oldRealm.objects<PaperEntity>("PaperEntity");
    const newObjects = newRealm.objects<PaperEntity>("PaperEntity");
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldObjects) {
      const oldObject = oldObjects[objectIndex];
      const newObject = newObjects[objectIndex];
      newObject["title"] = oldObject["title"] ? oldObject["title"] : "";
      newObject["authors"] = oldObject["authors"] ? oldObject["authors"] : "";
      newObject["publication"] = oldObject["publication"]
        ? oldObject["publication"]
        : "";
      newObject["pubTime"] = oldObject["pubTime"] ? oldObject["pubTime"] : "";
      newObject["pubType"] = oldObject["pubType"] ? oldObject["pubType"] : 2;
      newObject["note"] = oldObject["note"] ? oldObject["note"] : "";
      newObject["doi"] = oldObject["doi"] ? oldObject["doi"] : "";
      newObject["arxiv"] = oldObject["arxiv"] ? oldObject["arxiv"] : "";
      newObject["rating"] = oldObject["rating"] ? oldObject["rating"] : 0;
      newObject["flag"] = oldObject["flag"] ? oldObject["flag"] : false;
    }
  }

  if (oldVersion <= 2) {
    const newObjects = newRealm.objects<PaperEntity>("PaperEntity");
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in newObjects) {
      const newObject = newObjects[objectIndex];

      newObject["mainURL"] = path.basename(newObject["mainURL"]);
      const newObjectSupURLs = [];
      for (const supURL of newObject["supURLs"]) {
        newObjectSupURLs.push(path.basename(supURL));
      }
      newObject["supURLs"] = newObjectSupURLs;
    }
  }

  if (oldVersion <= 3) {
    const oldObjects = oldRealm.objects<PaperEntity>("PaperEntity");
    const newObjects = newRealm.objects<PaperEntity>("PaperEntity");
    // loop through all objects and set the fullName property in the new schema
    for (const objectIndex in oldObjects) {
      const oldObject = oldObjects[objectIndex];
      const newObject = newObjects[objectIndex];
      newObject["_id"] = oldObject["id"];
    }
  }

  if (oldVersion <= 4) {
    const oldTags = oldRealm.objects<PaperEntity>("PaperTag");
    const newTags = newRealm.objects<PaperEntity>("PaperTag");
    for (const objectIndex in oldTags) {
      const newTag = newTags[objectIndex];
      newTag["_id"] = new ObjectId();
    }

    const oldFolders = oldRealm.objects<PaperEntity>("PaperFolder");
    const newFolders = newRealm.objects<PaperEntity>("PaperFolder");
    for (const objectIndex in oldFolders) {
      const newFolder = newFolders[objectIndex];
      newFolder["_id"] = new ObjectId();
    }
  }

  if (oldVersion <= 5) {
    const newEntities = newRealm.objects<PaperEntity>("PaperEntity");
    for (const objectIndex in newEntities) {
      const newEntity = newEntities[objectIndex];
      newEntity["codes"] = [];
    }
  }

  if (oldVersion <= 6) {
    const newEntities = newRealm.objects<PaperEntity>("PaperEntity");
    for (const objectIndex in newEntities) {
      const newEntity = newEntities[objectIndex];
      newEntity["pages"] = "";
      newEntity["volume"] = "";
      newEntity["number"] = "";
      newEntity["publisher"] = "";
    }
  }
}
