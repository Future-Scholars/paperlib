import Realm from "realm";
import { ObjectId } from "bson";
import path from "path";
import { PaperEntityDraft, PaperEntitySchema } from "../models/PaperEntity";
import { PaperTagSchema } from "../models/PaperTag";
import { PaperFolderSchema } from "../models/PaperFolder";
import { formatString } from "../utils/misc";

export class DBRepository {
    constructor(preference, sharedState) {
        this.preference = preference;
        this.sharedState = sharedState;

        this._realm = null;
        this._schemaVersion = 5;

        this.app = null;
        this.cloudConfig = null;
        this.localConfig = null;

        this.entitiesListenerInited = false;
        this.tagsListenerInited = false;
        this.foldersListenerInited = false;
    }

    async realm() {
        if (!this._realm) {
            await this.initRealm();
        }
        return this._realm;
    }

    async initRealm(reinit = false) {
        if (this._realm || reinit) {
            if (this._realm) {
                this._realm.close();
            }
            this._realm = null;
            this.app = null;
            this.cloudConfig = null;
            this.localConfig = null;
            this.entitiesListenerInited = false;
            this.tagsListenerInited = false;
            this.foldersListenerInited = false;
        }

        if (this._realm) {
            return;
        }
        await this.getConfig();
        if (this.cloudConfig) {
            try {
                this._realm = new Realm(this.cloudConfig);
            } catch (err) {
                console.log(err);
            }
        } else {
            try {
                this._realm = new Realm(this.localConfig);
            } catch (err) {
                console.log(err);
            }
        }
    }

    async getConfig() {
        if (
            this.preference.get("useSync") &&
            this.preference.get("syncAPIKey") !== ""
        ) {
            return await this.getCloudConfig();
        } else {
            this.cloudConfig = null;
            return this.getLocalConfig();
        }
    }

    getLocalConfig() {
        let config = {
            schema: [PaperEntitySchema, PaperTagSchema, PaperFolderSchema],
            schemaVersion: this._schemaVersion,
            path: path.join(
                this.preference.get("appLibFolder"),
                "default.realm"
            ),
            migration: this.migrate,
        };
        this.localConfig = config;
        return config;
    }

    async getCloudConfig() {
        let cloudUser = await this.loginCloud();
        if (cloudUser) {
            let config = {
                schema: [PaperEntitySchema, PaperTagSchema, PaperFolderSchema],
                schemaVersion: this._schemaVersion,
                sync: {
                    user: this.app.currentUser,
                    partitionValue: this.app.currentUser.id,
                },
                path: path.join(
                    this.sharedState.get("dbState.defaultPath"),
                    "synced.realm"
                ),
            };
            this.cloudConfig = config;
            return config;
        } else {
            this.preference.set("useSync", false);
            this.sharedState.set(
                "viewState.preferenceUpdated",
                new Date().getTime()
            );
            return this.getLocalConfig();
        }
    }

    async loginCloud() {
        await this.logoutCloud();

        if (!this.app) {
            process.chdir(this.sharedState.get("dbState.defaultPath"));
            this.app = new Realm.App({
                id: "paperlib-iadbj",
            });
        }
        try {
            const credentials = Realm.Credentials.serverApiKey(
                this.preference.get("syncAPIKey")
            );
            await this.app.logIn(credentials);
            console.log("Successfully logged in!");
            return this.app.currentUser;
        } catch (err) {
            this.preference.set("useSync", false);
            this.sharedState.set(
                "viewState.preferenceUpdated",
                new Date().getTime()
            );
            console.error("Failed to log in", err.message);
            return null;
        }
    }

    async logoutCloud() {
        if (this.app && this.app.currentUser) {
            await this.app.currentUser.logOut();
        }
    }

    async migrateLocaltoSync() {
        try {
            let localConfig = this.getLocalConfig();
            let localRealm = new Realm(localConfig);

            let entities = localRealm.objects("PaperEntity")
            let entityDrafts = entities.map((entity) => new PaperEntityDraft(entity))

            await this.update(entityDrafts);
        } catch (error) {
            console.log(error);
        }
    }

    migrate(oldRealm, newRealm) {
        // only apply this change if upgrading to schemaVersion 2
        if (oldRealm.schemaVersion == 1) {
            const oldObjects = oldRealm.objects("PaperEntity");
            const newObjects = newRealm.objects("PaperEntity");
            // loop through all objects and set the fullName property in the new schema
            for (const objectIndex in oldObjects) {
                const oldObject = oldObjects[objectIndex];
                const newObject = newObjects[objectIndex];

                newObject["title"] = oldObject["title"]
                    ? oldObject["title"]
                    : "";
                newObject["authors"] = oldObject["authors"]
                    ? oldObject["authors"]
                    : "";
                newObject["publication"] = oldObject["publication"]
                    ? oldObject["publication"]
                    : "";
                newObject["pubTime"] = oldObject["pubTime"]
                    ? oldObject["pubTime"]
                    : "";
                newObject["pubType"] = oldObject["pubType"]
                    ? oldObject["pubType"]
                    : 2;
                newObject["note"] = oldObject["note"] ? oldObject["note"] : "";
                newObject["doi"] = oldObject["doi"] ? oldObject["doi"] : "";
                newObject["arxiv"] = oldObject["arxiv"]
                    ? oldObject["arxiv"]
                    : "";
                newObject["rating"] = oldObject["rating"]
                    ? oldObject["rating"]
                    : 0;
                newObject["flag"] = oldObject["flag"]
                    ? oldObject["flag"]
                    : false;

                newObject["mainURL"] = path.basename(
                    oldObject["mainURL"] ? oldObject["mainURL"] : ""
                );
                let newObjectSupURLs = [];
                for (const supURL of newObject["supURLs"]) {
                    newObjectSupURLs.push(path.basename(supURL));
                }
                newObject["supURLs"] = newObjectSupURLs;
                newObject["_id"] = oldObject["id"];
            }

            const oldTags = oldRealm.objects("PaperTag");
            const newTags = newRealm.objects("PaperTag");
            // loop through all objects and set the fullName property in the new schema
            for (const objectIndex in oldTags) {
                const oldTag = oldTags[objectIndex];
                const newTag = newTags[objectIndex];
                newTag["_id"] = new ObjectId();
            }

            const oldFolders = oldRealm.objects("PaperFolder");
            const newFolders = newRealm.objects("PaperFolder");
            // loop through all objects and set the fullName property in the new schema
            for (const objectIndex in oldFolders) {
                const oldFolder = oldFolders[objectIndex];
                const newFolder = newFolders[objectIndex];
                newFolder["_id"] = new ObjectId();
            }
        }

        if (oldRealm.schemaVersion == 2) {
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
                newObject["_id"] = oldObject["id"];
            }

            const oldTags = oldRealm.objects("PaperTag");
            const newTags = newRealm.objects("PaperTag");
            // loop through all objects and set the fullName property in the new schema
            for (const objectIndex in oldTags) {
                const oldTag = oldTags[objectIndex];
                const newTag = newTags[objectIndex];
                newTag["_id"] = new ObjectId();
            }

            const oldFolders = oldRealm.objects("PaperFolder");
            const newFolders = newRealm.objects("PaperFolder");
            // loop through all objects and set the fullName property in the new schema
            for (const objectIndex in oldFolders) {
                const oldFolder = oldFolders[objectIndex];
                const newFolder = newFolders[objectIndex];
                newFolder["_id"] = new ObjectId();
            }
        }

        if (oldRealm.schemaVersion == 3) {
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
                newTag["_id"] = new ObjectId();
            }

            const oldFolders = oldRealm.objects("PaperFolder");
            const newFolders = newRealm.objects("PaperFolder");
            // loop through all objects and set the fullName property in the new schema
            for (const objectIndex in oldFolders) {
                const oldFolder = oldFolders[objectIndex];
                const newFolder = newFolders[objectIndex];
                newFolder["_id"] = new ObjectId();
            }
        }

        if (oldRealm.schemaVersion == 4) {
            const oldTags = oldRealm.objects("PaperTag");
            const newTags = newRealm.objects("PaperTag");
            for (const objectIndex in oldTags) {
                const newTag = newTags[objectIndex];
                newTag["_id"] = new ObjectId();
            }

            const oldFolders = oldRealm.objects("PaperFolder");
            const newFolders = newRealm.objects("PaperFolder");
            for (const objectIndex in oldFolders) {
                const newFolder = newFolders[objectIndex];
                newFolder["_id"] = new ObjectId();
            }
        }
    }

    // ===========================================================
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
            filterFormat += `(ANY tags.name == \"${tag}\") AND `;
        }
        if (folder) {
            filterFormat += `(ANY folders.name == \"${folder}\") AND `;
        }

        let realm = await this.realm();
        let objects = realm
            .objects("PaperEntity")
            .sorted(sortBy, sortOrder == "desc");
        
        this.sharedState.set("viewState.entitiesCount", objects.length);

        if (!this.entitiesListenerInited) {
            objects.addListener((objs, changes) => {
                let deletionCount = changes.deletions.length;
                let insertionCount = changes.insertions.length
                let modificationCount = changes.modifications.length
                if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
                    this.sharedState.set("dbState.entitiesUpdated", new Date().getTime());
                }
            });
            this.entitiesListenerInited = true;
        }

        if (filterFormat) {
            filterFormat = filterFormat.slice(0, -5);

            return objects.filtered(filterFormat).toJSON().map((entity) => {
                entity.id = entity.id.toString()
                entity._id = entity._id.toString()
                return entity
            }); 
        } else {
            return objects.toJSON().map((entity) => {
                entity.id = entity.id.toString()
                entity._id = entity._id.toString()
                return entity
            });
        }
    }

    async tags() {
        let realm = await this.realm();
        let objects = realm.objects("PaperTag").sorted("name");
        if (!this.tagsListenerInited) {
            objects.addListener((objs, changes) => {
                let deletionCount = changes.deletions.length;
                let insertionCount = changes.insertions.length
                let modificationCount = changes.modifications.length
                if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
                    this.sharedState.set("dbState.tagsUpdated", new Date().getTime());
                }
            });
            this.tagsListenerInited = true;
        };
        return objects.toJSON();
    }

    async folders() {
        let realm = await this.realm();
        let objects = realm.objects("PaperFolder").sorted("name");
        if (!this.foldersListenerInited) {
            objects.addListener((objs, changes) => {
                let deletionCount = changes.deletions.length;
                let insertionCount = changes.insertions.length
                let modificationCount = changes.modifications.length
                if (deletionCount > 0 || insertionCount > 0 || modificationCount > 0) {
                    this.sharedState.set("dbState.foldersUpdated", new Date().getTime());
                }
            });
            this.foldersListenerInited = true;
        };
        return objects.toJSON();
    }

    async preprintEntities() {
        let realm = await this.realm();

        let filterFormat = 'publication contains[c] "arXiv"';
        return realm.objects("PaperEntity").filtered(filterFormat).toJSON();
    }

    // ============================================================
    // Delete
    async delete(ids) {
        let realm = await this.realm();
        const idsQuery = ids.map(id => `_id == oid(${id})`).join(' OR ');
        let entities = realm.objects("PaperEntity").filtered(`(${idsQuery})`);
        var removeFileURLs = new Array();
        try {
            realm.write(() => {
                for (let entity of entities) {
                    removeFileURLs.push(entity.mainURL)
                    removeFileURLs.push(...entity.supURLs)

                    this.unlinkCategorizers(entity.tags, realm)
                    this.unlinkCategorizers(entity.folders, realm)
                }
                realm.delete(entities);
            });
            return removeFileURLs
        } catch (error) {
            console.log(error)
            return []
        }
    }

    async deleteTag(tagName) {
        let realm = await this.realm();
        realm.write(() => {
            let tagObjs = realm
                .objects("PaperTag")
                .filtered(`name == "${tagName}"`);
            realm.delete(tagObjs);
        });
    }

    async deleteFolder(folderName) {
        let realm = await this.realm();
        realm.write(() => {
            let folderObjs = realm
                .objects("PaperFolder")
                .filtered(`name == "${folderName}"`);
            realm.delete(folderObjs);
        });
    }

    unlinkCategorizers(categorizers, realm) {
        categorizers.forEach (
            (categorizer) => {
                categorizer.count -= 1
                if (categorizer.count <= 0) {
                    realm.delete(categorizer)
                }
            }
        );
    }

    linkCategorizers(categorizerStrs, realm, categorizerType) {
        var categorizers = [];
        let categorizerNameList = new Set(categorizerStrs.split(";"))
        for (var categorizerName of categorizerNameList) {
            var categorizerName = formatString({
                str: categorizerName,
                returnEmpty: true,
                trimWhite: true
            });
            if (categorizerName === "") {
                continue;
            }
            let existCategorizers = realm.objects(categorizerType).filtered(`name == "${categorizerName}"`)
            if (existCategorizers.length > 0) {
                let categorizer = existCategorizers[0]
                categorizer.count += 1
                categorizers.push(categorizer)
            } else {
                let categorizer = {
                    _id: new ObjectId(),
                    name: categorizerName,
                    count: 1,
                }
                if (this.cloudConfig) {
                    categorizer["_partition"] = this.app.currentUser.id.toString()
                }
                realm.create(categorizerType, categorizer);
                categorizers.push(categorizer)
            }
        }
        return categorizers
    }

    // Update
    async update(entities) {
        let realm = await this.realm();
        let successes = [];
        realm.write(() => {
            for (let entity of entities) {
                let updateObj = realm.objectForPrimaryKey(
                    "PaperEntity",
                    new ObjectId(entity._id)
                );
                if (updateObj) {
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

                    // remove old tags
                    this.unlinkCategorizers(updateObj.tags, realm)
                    // add new tags
                    updateObj.tags = this.linkCategorizers(entity.tags, realm, "PaperTag")
                    // remove old folders
                    this.unlinkCategorizers(updateObj.folders, realm)
                    // add new folders
                    updateObj.folders = this.linkCategorizers(entity.folders, realm, "PaperFolder")
                    successes.push(true);
                }
                else {
                    if (this.cloudConfig) {
                        entity._partition = this.app.currentUser.id.toString();
                    }
                    entity.tags = [];
                    entity.folders = [];

                    let reduplicatedEntities = realm
                        .objects("PaperEntity")
                        .filtered(
                            `title == \"${entity.title}\" and authors == \"${entity.authors}\"`
                        );
                    if (reduplicatedEntities.length > 0) {
                        continue;
                    }
                    realm.create("PaperEntity", entity);
                    successes.push(true);
                }
            }
        });
        return successes;
    }
}
