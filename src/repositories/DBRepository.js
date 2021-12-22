import Realm from "realm";
import { ObjectId } from "bson";
import path from "path";
import { PaperEntitySchema } from "../models/PaperEntity";
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

  realm() {
    if (!this._realm) {
      this.initRealm();
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

    // Write to sync server
    await this.loginSync();
    this._realm.write(() => {
      for (let entity of entities) {
        entity._partition = this.app.currentUser.id;
        for (let tag of entity.tags) {
          tag._partition = this.app.currentUser.id;
        }
        for (let folder of entity.folders) {
          folder._partition = this.app.currentUser.id;
        }
      }
    });

    this.initSync();
    this.realm(true).write(() => {
      for (let entity of entities) {
        this.realm(true).create("PaperEntity", entity);
      }
    });
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
      entitiesJson.push(entityJson);
    });
    return entitiesJson;
  }

  entity(id) {
    return this.realm().objectForPrimaryKey("PaperEntity", new ObjectId(id));
  }

  entities(search, flag, tag, folder, sortBy, sortOrder) {
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

    if (filterFormat) {
      filterFormat = filterFormat.slice(0, -5);
      return this.jsonfyEntity(
        this.realm()
          .objects("PaperEntity")
          .filtered(filterFormat)
          .sorted(sortBy, sortOrder == "desc")
      );
    } else {
      return this.jsonfyEntity(
        this.realm()
          .objects("PaperEntity")
          .sorted(sortBy, sortOrder == "desc")
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

  tags() {
    return this.jsonfyTagFolder(this.realm().objects("PaperTag"));
  }

  folders() {
    return this.jsonfyTagFolder(this.realm().objects("PaperFolder"));
  }

  // ============================================================
  // Add
  add(entity) {
    if (this.syncUser) {
      entity._partition = this.syncUser.id;
    }
    entity.tags = [];
    entity.folders = [];

    let existEntities = this.realm()
      .objects("PaperEntity")
      .filtered(
        `title == \"${entity.title}\" and authors == \"${entity.authors}\"`
      );
    if (existEntities.length > 0) {
      return false;
    }
    this.realm().write(() => {
      this.realm().create("PaperEntity", entity);
    });
    return true;
  }

  // Delete
  delete(entity) {
    this.realm().write(() => {
      for (let tag of entity.tags) {
        let tagObj = this.realm().objectForPrimaryKey("PaperTag", tag._id);
        tagObj.count -= 1;
        if (tagObj.count <= 0) {
          this.realm().delete(tagObj);
        }
      }

      for (let folder of entity.folders) {
        let folderObj = this.realm().objectForPrimaryKey(
          "PaperFolder",
          folder._id
        );
        folderObj.count -= 1;
        if (folderObj.count <= 0) {
          this.realm().delete(folderObj);
        }
      }

      this.realm().delete(
        this.realm().objectForPrimaryKey(
          "PaperEntity",
          new ObjectId(entity._id)
        )
      );
    });
  }

  deleteTag(tagId) {
    this.realm().write(() => {
      let tagObj = this.realm().objectForPrimaryKey("PaperTag", tagId);
      this.realm().delete(tagObj);
    });
  }

  deleteFolder(folderId) {
    this.realm().write(() => {
      let folderObj = this.realm().objectForPrimaryKey("PaperFolder", folderId);
      this.realm().delete(folderObj);
    });
  }

  // Update
  update(entity) {
    let editEntity = this.realm().objectForPrimaryKey(
      "PaperEntity",
      new ObjectId(entity._id)
    );
    this.realm().write(() => {
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

      // remove old tags
      for (const tag of editEntity.tags) {
        let tagObj = this.realm().objectForPrimaryKey("PaperTag", tag._id);
        tagObj.count -= 1;
        if (tagObj.count <= 0) {
          this.realm().delete(tagObj);
        }
      }
      editEntity.tags = [];
      // add new tags
      var tagList;
      if (typeof entity.tags == "string") {
        let tagsStr = formatString({ str: entity.tags, removeWhite: true });
        tagList = tagsStr.split(";");
      } else {
        tagList = entity.tags.map((tag) => {
          return tag.name;
        });
      }
      for (const tag of tagList) {
        let tagStr = formatString({
          str: tag,
          returnEmpty: true,
          trimWhite: true,
        });
        if (tagStr) {
          let tagObj = this.realm().objectForPrimaryKey(
            "PaperTag",
            "tag-" + tagStr
          );
          if (tagObj) {
            tagObj.count += 1;
            editEntity.tags.push(tagObj);
          } else {
            let tagObj = {
              _id: "tag-" + tagStr,
              name: tagStr,
              count: 1,
            };
            this.realm().create("PaperTag", tagObj);
            tagObj = this.realm().objectForPrimaryKey(
              "PaperTag",
              "tag-" + tagStr
            );
            editEntity.tags.push(tagObj);
          }
        }
      }
      // remove old folders
      for (const folder of editEntity.folders) {
        let folderObj = this.realm().objectForPrimaryKey(
          "PaperFolder",
          folder._id
        );
        folderObj.count -= 1;
        if (folderObj.count <= 0) {
          this.realm().delete(folderObj);
        }
      }
      editEntity.folders = [];
      // add new folders
      var folderList;
      if (typeof entity.folders == "string") {
        let foldersStr = formatString({
          str: entity.folders,
          removeWhite: true,
        });
        folderList = foldersStr.split(";");
      } else {
        folderList = entity.folders.map((folder) => {
          return folder.name;
        });
      }

      for (const folder of folderList) {
        let folderStr = formatString({
          str: folder,
          returnEmpty: true,
          trimWhite: true,
        });
        if (folderStr) {
          let folderObj = this.realm().objectForPrimaryKey(
            "PaperFolder",
            "folder-" + folderStr
          );
          if (folderObj) {
            folderObj.count += 1;
            editEntity.folders.push(folderObj);
          } else {
            let folderObj = {
              _id: "folder-" + folderStr,
              name: folderStr,
              count: 1,
            };
            this.realm().create("PaperFolder", folderObj);
            folderObj = this.realm().objectForPrimaryKey(
              "PaperFolder",
              "folder-" + folderStr
            );
            editEntity.folders.push(folderObj);
          }
        }
      }
    });
  }
}
