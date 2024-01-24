import { ObjectId } from "bson";
import path from "path";
import Realm from "realm";

import { CategorizerType, PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { QuerySentence } from "@/models/query-sentence";

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
    // Migrate PaperTag
    const oldTags = oldRealm.objects<PaperTag>("PaperTag");
    if (oldTags.length > 0) {
      const _partition = oldTags[0]._partition;
      // 1. Create Tag Root QuerySentence for Tags.
      const tagRootQuerySentence = newRealm.create<QuerySentence>(
        "QuerySentence",
        {
          _id: new ObjectId(),
          _partition,
          name: "Tags",
          query: "true",
          color: "blue",
          inEdgeNodes: [],
        }
      );

      // 2. Create Tag QuerySentence for each Tag.
      for (const oldTag of oldTags) {
        const tagQuerySentence = newRealm.create<QuerySentence>(
          "QuerySentence",
          {
            _id: new ObjectId(),
            _partition,
            name: oldTag.name,
            query: `tags.name == "${oldTag.name}"`,
            // @ts-ignore
            color: oldTag.color,
            inEdgeNodes: [],
          }
        );

        tagRootQuerySentence.inEdgeNodes.push(tagQuerySentence);
      }
    }

    // Migrate PaperFolder
    const oldFolders = oldRealm.objects<PaperFolder>("PaperFolder");
    if (oldFolders.length > 0) {
      const _partition = oldFolders[0]._partition;
      // 1. Create Folder Root QuerySentence for Folders.
      const folderRootQuerySentence = newRealm.create<QuerySentence>(
        "QuerySentence",
        {
          _id: new ObjectId(),
          _partition,
          name: "Folders",
          query: "true",
          color: "blue",
          inEdgeNodes: [],
        }
      );

      // 2. Create Folder QuerySentence for each Folder.
      for (const oldFolder of oldFolders) {
        const folderQuerySentence = newRealm.create<QuerySentence>(
          "QuerySentence",
          {
            _id: new ObjectId(),
            _partition,
            name: oldFolder.name,
            query: `folders.name == "${oldFolder.name}"`,
            // @ts-ignore
            color: oldFolder.color,
            inEdgeNodes: [],
          }
        );

        folderRootQuerySentence.inEdgeNodes.push(folderQuerySentence);
      }
    }

    // Migrate SmartFilters
    const oldSmartFilters = oldRealm.objects("PaperPaperSmartFilter");
    if (oldSmartFilters.length > 0) {
      // @ts-ignore
      const _partition = oldSmartFilters[0]._partition;
      // 1. Create SmartFilter Root QuerySentence for SmartFilters.
      const smartFilterRootQuerySentence = newRealm.create<QuerySentence>(
        "QuerySentence",
        {
          _id: new ObjectId(),
          _partition,
          name: "SmartFilters",
          query: "true",
          color: "blue",
          inEdgeNodes: [],
        }
      );

      // 2. Create SmartFilter QuerySentence for each SmartFilter.
      for (const oldSmartFilter of oldSmartFilters) {
        const smartFilterQuerySentence = newRealm.create<QuerySentence>(
          "QuerySentence",
          {
            _id: new ObjectId(),
            _partition,
            // @ts-ignore
            name: oldSmartFilter.name,
            // @ts-ignore
            query: oldSmartFilter.filter,
            // @ts-ignore
            color: oldSmartFilter.color,
            inEdgeNodes: [],
          }
        );

        smartFilterRootQuerySentence.inEdgeNodes.push(smartFilterQuerySentence);
      }
    }
    newRealm.deleteModel("PaperPaperSmartFilter");
  }
}
