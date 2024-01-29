import { ObjectId } from "bson";
import path from "path";
import Realm from "realm";

import { CategorizerType, PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";

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
      const newObjectSupURLs: string[] = [];
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
    const oldTags = oldRealm.objects<PaperEntity>(CategorizerType.PaperTag);
    const newTags = newRealm.objects<PaperEntity>(CategorizerType.PaperTag);
    for (const objectIndex in oldTags) {
      const newTag = newTags[objectIndex];
      newTag["_id"] = new ObjectId();
    }

    const oldFolders = oldRealm.objects<PaperEntity>(
      CategorizerType.PaperFolder
    );
    const newFolders = newRealm.objects<PaperEntity>(
      CategorizerType.PaperFolder
    );
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

  if (oldVersion <= 9) {
    console.log("Migrate from version <=9 to 10");
    // Migrate PaperTag
    const oldTags = oldRealm.objects<PaperTag>(PaperTag.schema.name);
    const newTags = newRealm.objects<PaperTag>(PaperTag.schema.name);

    if (oldTags.length > 0) {
      const _partition = oldTags[0]._partition;
      // 1. Create Tag Root for Tags.
      const tagRoot = newRealm.create<PaperTag>(PaperTag.schema.name, {
        _id: new ObjectId(),
        _partition,
        name: "Tags",
        count: 0,
        color: "blue",
        children: [],
      });

      for (const tag of newTags) {
        if (tag.name === "Tags") {
          continue;
        }

        const oldTag = oldTags.find((t) => `${t._id}` === `${tag._id}`);
        if (!oldTag) {
          continue;
        }

        tag.children = [];
        tag.color = oldTag.color || "blue";
        tagRoot.children.push(tag);
        tag.count = tag.linkingObjects<PaperEntity>(
          PaperEntity.schema.name,
          "tags"
        ).length;
      }
    }

    // Migrate PaperFolder
    const oldFolders = oldRealm.objects<PaperFolder>(PaperFolder.schema.name);
    const newFolders = newRealm.objects<PaperFolder>(PaperFolder.schema.name);
    if (oldFolders.length > 0) {
      const _partition = oldFolders[0]._partition;
      // 1. Create Folder Root for Folders.
      const folderRoot = newRealm.create<PaperFolder>(PaperFolder.schema.name, {
        _id: new ObjectId(),
        _partition,
        name: "Folders",
        color: "blue",
        count: 0,
        children: [],
      });

      for (const folder of newFolders) {
        if (folder.name === "Folders") {
          continue;
        }
        const oldFolder = oldFolders.find(
          (t) => `${t._id}` === `${folder._id}`
        );
        if (!oldFolder) {
          continue;
        }

        folder.children = [];
        folder.color = oldFolder.color || "blue";
        folderRoot.children.push(folder);
        folder.count = folder.linkingObjects<PaperEntity>(
          PaperEntity.schema.name,
          "folders"
        ).length;
      }
    }

    // Migrate SmartFilters
    const oldSmartFilters = oldRealm.objects<PaperSmartFilter>(
      "PaperPaperSmartFilter"
    );
    const newSmartFilters = newRealm.objects<PaperSmartFilter>(
      PaperSmartFilter.schema.name
    );

    if (oldSmartFilters.length > 0) {
      const _partition = oldSmartFilters[0]._partition;
      // 1. Create SmartFilter Root for SmartFilters.
      const smartFilterRoot = newRealm.create<PaperSmartFilter>(
        PaperSmartFilter.schema.name,
        {
          _id: new ObjectId(),
          _partition,
          name: "SmartFilters",
          color: "blue",
          filter: "true",
          children: [],
        }
      );

      for (const smartFilter of oldSmartFilters) {
        if (smartFilter.name === "SmartFilters") {
          continue;
        }
        const oldSmartFilter = oldSmartFilters.find(
          (t) => `${t._id}` === `${smartFilter._id}`
        );
        if (!oldSmartFilter) {
          continue;
        }

        smartFilter.children = [];
        smartFilter.color = oldSmartFilter.color || "blue";
        smartFilterRoot.children.push(smartFilter);
      }
    }
    newRealm.deleteModel("PaperPaperSmartFilter");
  }
}

export function syncMigrate(
  realm: Realm,
  partition: string,
  oldVersion: number
) {
  if (oldVersion <= 9) {
    console.log("Migrate sync db from version <=9 to 10");
    // Migrate PaperTag
    // Check if have Tag Root
    const oldTags = realm.objects<PaperTag>(PaperTag.schema.name);
    const oldTagRoot = oldTags.filtered("name == 'Tags'")[0];
    if (oldTagRoot) {
      realm.delete(oldTagRoot);
    }

    const tagRoot = realm.create<PaperTag>(PaperTag.schema.name, {
      _id: new ObjectId(),
      _partition: partition,
      name: "Tags",
      count: 0,
      color: "blue",
      children: [],
    });

    for (const tag of oldTags) {
      if (tag.name === "Tags") {
        continue;
      }

      tag.children = [];
      tag.color = tag.color || "blue";
      tagRoot.children.push(tag);
      tag.count = tag.linkingObjects<PaperEntity>(
        PaperEntity.schema.name,
        "tags"
      ).length;
    }

    // Migrate PaperFolder
    // Check if have Folder Root
    const oldFolders = realm.objects<PaperFolder>(PaperFolder.schema.name);
    const oldFolderRoot = oldFolders.filtered("name == 'Folders'")[0];
    if (oldFolderRoot) {
      realm.delete(oldFolderRoot);
    }

    const folderRoot = realm.create<PaperFolder>(PaperFolder.schema.name, {
      _id: new ObjectId(),
      _partition: partition,
      name: "Folders",
      color: "blue",
      count: 0,
      children: [],
    });

    for (const folder of oldFolders) {
      if (folder.name === "Folders") {
        continue;
      }

      folder.children = [];
      folder.color = folder.color || "blue";
      folderRoot.children.push(folder);
      folder.count = folder.linkingObjects<PaperEntity>(
        PaperEntity.schema.name,
        "folders"
      ).length;
    }

    // Migrate SmartFilters
    const oldSmartFilters = realm.objects<PaperSmartFilter>(
      "PaperPaperSmartFilter"
    );

    const newSmartFilters = realm.objects<PaperSmartFilter>(
      PaperSmartFilter.schema.name
    );

    // Check if have SmartFilter Root
    const oldSmartFilterRoot = newSmartFilters.filtered(
      "name == 'SmartFilters'"
    )[0];

    if (oldSmartFilterRoot) {
      realm.delete(oldSmartFilterRoot);
    }

    const smartFilterRoot = realm.create<PaperSmartFilter>(
      PaperSmartFilter.schema.name,
      {
        _id: new ObjectId(),
        _partition: partition,
        name: "SmartFilters",
        color: "blue",
        filter: "true",
        children: [],
      }
    );

    if (oldSmartFilters.length > 0) {
      for (const smartFilter of oldSmartFilters) {
        if (smartFilter.name === "SmartFilters") {
          continue;
        }

        const newSmartFilter = realm.create<PaperSmartFilter>(
          PaperSmartFilter.schema.name,
          {
            _id: new ObjectId(),
            _partition: partition,
            name: smartFilter.name,
            color: smartFilter.color || "blue",
            filter: smartFilter.filter || "true",
            children: [],
          }
        );
        smartFilterRoot.children.push(newSmartFilter);
      }
    }
  }
}
