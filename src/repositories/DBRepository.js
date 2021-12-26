import Realm from "realm";
import { ObjectId } from "bson";
import path from "path";
import { PaperEntityDraft, PaperEntitySchema } from "../models/PaperEntity";
import { PaperTagSchema } from "../models/PaperTag";
import { PaperFolderSchema } from "../models/PaperFolder";
import { formatString } from "../utils/misc";

export class DBRepository {
  constructor(appStore) {
    this.appStore = appStore;

    this._realmApp = null;
    this._realm = null;
    this._schemaVersion = 4;

    this.initRealm();
  }

  async realm() {
    if (!this._realm) {
      await this.initRealm();
    }
    return this._realm;
  }

  async initRealm() {
    if (this._realm) {
      this._realm.close();
      this._realm = null;
    }
    if (this.appStore.get("useSync") && this.appStore.get("syncAPIKey")) {
      await this.initSync();
    } else {
      this.initLocal();
    }
  }

  async loginSync() {
    if (!this.syncUser) {
      this._realmApp = new Realm.App({ id: "paperlib-iadbj" });
      let apiKey = this.appStore.get("syncAPIKey");
      const credentials = Realm.Credentials.serverApiKey(apiKey);
      try {
        this.syncUser = await this._realmApp.logIn(credentials);
        console.log("Successfully logged in!");
      } catch (err) {
        this.appStore.set("useSync", false);
        console.error("Failed to log in", err.message);
      }
    }
  }

  async initSync() {
    console.log("Init Sync.");
    await this.loginSync();
    this._realm = new Realm({
      schema: [PaperEntitySchema, PaperTagSchema, PaperFolderSchema],
      schemaVersion: this._schemaVersion,
      sync: {
        user: this.syncUser,
        partitionValue: this.syncUser.id,
      },
    });
  }

  initLocal() {
    console.log("Init Local.");
    this._realm = new Realm({
      schema: [PaperEntitySchema, PaperTagSchema, PaperFolderSchema],
      schemaVersion: this._schemaVersion,
      path: path.join(this.appStore.get("appLibFolder"), "default.realm"),
      migration: this.migrate,
    });
  }

  async migrateLocaltoSync() {
    if (this._realm) {
      this._realm.close();
    }
    // Read local data
    this.initLocal();
    var entities = this._realm.objects("PaperEntity");

    console.log("Migrate local data to sync.");
    console.log(entities);
    // Write to sync server
    await this.initSync();

    // Add without tags and folders
    for (const entity of entities) {
      this.add(new PaperEntityDraft(entity));
    }
    // Add tags and folders
    for (const entity of entities) {
      await this.update(entity);
    }
  }

  migrate(oldRealm, newRealm) {
    // only apply this change if upgrading to schemaVersion 2
    if (oldRealm.schemaVersion < 2) {
      const oldObjects = oldRealm.objects("PaperEntity");
      const newObjects = newRealm.objects("PaperEntity");
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
        newObject["mainURL"] = oldObject["mainURL"] ? oldObject["mainURL"] : "";
        newObject["rating"] = oldObject["rating"] ? oldObject["rating"] : 0;
        newObject["flag"] = oldObject["flag"] ? oldObject["flag"] : false;
      }
    }

    if (oldRealm.schemaVersion < 3) {
      const newObjects = newRealm.objects("PaperEntity");
      // loop through all objects and set the fullName property in the new schema
      for (const objectIndex in newObjects) {
        const newObject = newObjects[objectIndex];

        newObject["mainURL"] = path.basename(newObject["mainURL"]);
        let newObjectSupURLs = [];
        for (const supURL of newObject["supURLs"]) {
          newObjectSupURLs.push(path.basename(supURL));
        }
        newObject["supURLs"] = newObjectSupURLs;
      }
    }

    if (oldRealm.schemaVersion < 4) {
      const oldObjects = oldRealm.objects("PaperEntity");
      const newObjects = newRealm.objects("PaperEntity");
      // loop through all objects and set the fullName property in the new schema
      for (const objectIndex in oldObjects) {
        const oldObject = oldObjects[objectIndex];
        const newObject = newObjects[objectIndex];
        newObject["_id"] = oldObject["id"];
      }

      const oldTags = oldRealm.objects("PaperTag");
      const newTags = newRealm.objects("PaperTag");
      // loop through all objects and set the fullName property in the new schema
      for (const objectIndex in oldTags) {
        const oldTag = oldTags[objectIndex];
        const newTag = newTags[objectIndex];
        newTag["_id"] = oldTag["id"];
      }

      const oldFolders = oldRealm.objects("PaperFolder");
      const newFolders = newRealm.objects("PaperFolder");
      // loop through all objects and set the fullName property in the new schema
      for (const objectIndex in oldFolders) {
        const oldFolder = oldFolders[objectIndex];
        const newFolder = newFolders[objectIndex];
        newFolder["_id"] = oldFolder["id"];
      }
    }
  }

  jsonfyEntity(entities) {
    var entitiesJson = [];
    entities.forEach((entity) => {
      let entityJson = entity.toJSON();
      entityJson._id = entityJson._id.toString();
      entityJson.id = entityJson.id.toString();
      entitiesJson.push(entityJson);
    });
    return entitiesJson;
  }

  async entity(id) {
    let realm = await this.realm();
    return realm.objectForPrimaryKey("PaperEntity", new ObjectId(id));
  }

  async entities(search, flag, tag, folder, sortBy, sortOrder) {
    var filterFormat = "";
    if (search) {
      filterFormat += `(title contains[c] \"${formatString({
        str: search,
      })}\" OR authors contains[c] \"${formatString({
        str: search,
      })}\" OR publication contains[c] \"${formatString({
        str: search,
      })}\" OR note contains[c] \"${formatString({
        str: search,
      })}\") AND `;
    }
    if (flag) {
      filterFormat += `flag == true AND `;
    }
    if (tag) {
      filterFormat += `(ANY tags._id == \"${tag}\") AND `;
    }
    if (folder) {
      filterFormat += `(ANY folders._id == \"${folder}\") AND `;
    }

    let realm = await this.realm();
    if (filterFormat) {
      filterFormat = filterFormat.slice(0, -5);
      return this.jsonfyEntity(
        realm
          .objects("PaperEntity")
          .filtered(filterFormat)
          .sorted(sortBy, sortOrder == "desc")
      );
    } else {
      return this.jsonfyEntity(
        realm.objects("PaperEntity").sorted(sortBy, sortOrder == "desc")
      );
    }
  }

  jsonfyTagFolder(tagOrFolder) {
    var jsons = [];
    tagOrFolder.forEach((obj) => {
      let json = obj.toJSON();
      jsons.push(json);
    });
    return jsons;
  }

  async tags() {
    let realm = await this.realm();
    return this.jsonfyTagFolder(realm.objects("PaperTag"));
  }

  async folders() {
    let realm = await this.realm();
    return this.jsonfyTagFolder(realm.objects("PaperFolder"));
  }

  // ============================================================

  async buildTag(entity) {
    let realm = await this.realm();
    var tagNames = [];
    var tagObjs = [];
    if (typeof entity.tags == "string") {
      let tagsStr = formatString({ str: entity.tags, removeWhite: true });
      tagNames = tagsStr.split(";");
    } else {
      tagNames = entity.tags.map((tag) => {
        return tag.name;
      });
    }
    for (const name of tagNames) {
      let tagName = formatString({
        str: name,
        returnEmpty: true,
        trimWhite: true,
      });
      if (tagName) {
        var tagObj;
        tagObj = realm.objectForPrimaryKey("PaperTag", "tag-" + tagName);
        if (tagObj) {
          realm.write(() => {
            tagObj.count += 1;
          });
        } else {
          tagObj = {
            _id: "tag-" + tagName,
            id: "tag-" + tagName,
            name: tagName,
            count: 1,
          };
        }
        if (this.syncUser) {
          realm.write(() => {
            tagObj._partition = this.syncUser.id;
          });
        }
        tagObjs.push(tagObj);
      }
    }
    return tagObjs;
  }

  async buildFolder(entity) {
    let realm = await this.realm();
    var folderNames = [];
    var folderObjs = [];
    if (typeof entity.folders == "string") {
      let foldersStr = formatString({ str: entity.folders, removeWhite: true });
      folderNames = foldersStr.split(";");
    } else {
      folderNames = entity.folders.map((folder) => {
        return folder.name;
      });
    }
    for (const name of folderNames) {
      let folderName = formatString({
        str: name,
        returnEmpty: true,
        trimWhite: true,
      });
      if (folderName) {
        var folderObj;
        folderObj = realm.objectForPrimaryKey(
          "PaperFolder",
          "folder-" + folderName
        );
        if (folderObj) {
          realm.write(() => {
            folderObj.count += 1;
          });
        } else {
          folderObj = {
            _id: "folder-" + folderName,
            id: "folder-" + folderName,
            name: folderName,
            count: 1,
          };
        }
        if (this.syncUser) {
          realm.write(() => {
            folderObj._partition = this.syncUser.id;
          });
        }
        folderObjs.push(folderObj);
      }
    }
    return folderObjs;
  }

  async add(entity) {
    if (this.syncUser) {
      entity._partition = this.syncUser.id;
    }
    entity.tags = [];
    entity.folders = [];

    let realm = await this.realm();

    let existEntities = realm
      .objects("PaperEntity")
      .filtered(
        `title == \"${entity.title}\" and authors == \"${entity.authors}\"`
      );
    if (existEntities.length > 0) {
      return false;
    }
    realm.write(() => {
      realm.create("PaperEntity", entity);
    });
    return true;
  }

  // Delete
  async delete(entity) {
    let realm = await this.realm();
    realm.write(() => {
      for (let tag of entity.tags) {
        let tagObj = realm.objectForPrimaryKey("PaperTag", tag._id);
        tagObj.count -= 1;
        if (tagObj.count <= 0) {
          realm.delete(tagObj);
        }
      }

      for (let folder of entity.folders) {
        let folderObj = realm.objectForPrimaryKey("PaperFolder", folder._id);
        folderObj.count -= 1;
        if (folderObj.count <= 0) {
          realm.delete(folderObj);
        }
      }

      realm.delete(
        realm.objectForPrimaryKey("PaperEntity", new ObjectId(entity._id))
      );
    });
  }

  async deleteTag(tagId) {
    let realm = await this.realm();
    realm.write(() => {
      let tagObj = realm.objectForPrimaryKey("PaperTag", tagId);
      realm.delete(tagObj);
    });
  }

  async deleteFolder(folderId) {
    let realm = await this.realm();
    realm.write(() => {
      let folderObj = realm.objectForPrimaryKey("PaperFolder", folderId);
      realm.delete(folderObj);
    });
  }

  // Update
  async update(entity) {
    let realm = await this.realm();
    let editEntity = realm.objectForPrimaryKey(
      "PaperEntity",
      new ObjectId(entity._id)
    );
    realm.write(() => {
      editEntity.title = entity.title;
      editEntity.authors = entity.authors;
      editEntity.publication = entity.publication;
      editEntity.pubTime = entity.pubTime;
      editEntity.pubType = entity.pubType;
      editEntity.doi = entity.doi;
      editEntity.arxiv = entity.arxiv;
      editEntity.mainURL = entity.mainURL;
      editEntity.supURLs = entity.supURLs;
      editEntity.rating = entity.rating;
      editEntity.flag = entity.flag;
      editEntity.note = entity.note;
    });

    realm.write(() => {
      // remove old tags
      for (const tag of editEntity.tags) {
        let tagObj = realm.objectForPrimaryKey("PaperTag", tag._id);
        tagObj.count -= 1;
        if (tagObj.count <= 0) {
          realm.delete(tagObj);
        }
      }
      editEntity.tags = [];
    });
    // add new tags
    let tagObjs = await this.buildTag(entity);
    realm.write(() => {
      for (const tag of tagObjs) {
        editEntity.tags.push(tag);
      }

      // remove old folders
      for (const folder of editEntity.folders) {
        let folderObj = realm.objectForPrimaryKey("PaperFolder", folder._id);
        folderObj.count -= 1;
        if (folderObj.count <= 0) {
          realm.delete(folderObj);
        }
      }
      editEntity.folders = [];
    });
    // add new folders
    let folderObjs = await this.buildFolder(entity);
    realm.write(() => {
      for (const folder of folderObjs) {
        editEntity.folders.push(folder);
      }
    });
  }
}
