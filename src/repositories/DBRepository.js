import Realm from "realm";
import { ObjectId } from "bson";
import path from "path";
import { PaperEntitySchema } from "../models/PaperEntity";
import { PaperTagSchema } from "../models/PaperTag";
import { PaperFolderSchema } from "../models/PaperFolder";
import { formatString } from "../utils/misc";

export class DBRepository {
  constructor(appStore) {
    this._realm = null;
    this._schemaVersion = 3;
    this.appStore = appStore;
  }

  realm() {
    if (this._realm) {
      return this._realm;
    }

    this.setRealmFolder(this.appStore.get("appLibFolder"));
    return this._realm;
  }

  setRealmFolder(folder) {
    if (this._realm) {
      this._realm.close();
    }
    this._realm = new Realm({
      schema: [PaperEntitySchema, PaperTagSchema, PaperFolderSchema],
      schemaVersion: this._schemaVersion,
      path: path.join(folder, "default.realm"),
      migration: this.migrate,
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
  }

  jsonfyEntity(entities) {
    var entitiesJson = [];
    entities.forEach((entity) => {
      let entityJson = entity.toJSON();
      entityJson.id = entityJson.id.toString();
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
      filterFormat += `(ANY tags.id == \"${tag}\") AND `;
    }
    if (folder) {
      filterFormat += `(ANY folders.id == \"${folder}\") AND `;
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
        let tagObj = this.realm().objectForPrimaryKey("PaperTag", tag.id);
        tagObj.count -= 1;
        if (tagObj.count <= 0) {
          this.realm().delete(tagObj);
        }
      }

      for (let folder of entity.folders) {
        let folderObj = this.realm().objectForPrimaryKey(
          "PaperFolder",
          folder.id
        );
        folderObj.count -= 1;
        if (folderObj.count <= 0) {
          this.realm().delete(folderObj);
        }
      }

      this.realm().delete(
        this.realm().objectForPrimaryKey("PaperEntity", new ObjectId(entity.id))
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
    this.realm().write(() => {
      let editEntity = this.realm().objectForPrimaryKey(
        "PaperEntity",
        new ObjectId(entity.id)
      );
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
        let tagObj = this.realm().objectForPrimaryKey("PaperTag", tag.id);
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
              id: "tag-" + tagStr,
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
          folder.id
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
              id: "folder-" + folderStr,
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
