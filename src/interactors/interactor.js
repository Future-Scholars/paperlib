import { FileRepository } from "../repositories/FileRepository";
import { DBRepository } from "../repositories/DBRepository";
import { WebRepository } from "../repositories/WebRepository";
import { Preference } from "../utils/preference";
import { PaperEntityDraft } from "../models/PaperEntity";
import { clipboard } from "electron";
import { formatString } from "../utils/misc";
import moment from "moment";
import { ToadScheduler, SimpleIntervalJob, Task } from "toad-scheduler";

export class Interactor {
    constructor(sharedState) {
        this.sharedState = sharedState;

        this.preference = new Preference();
        this.dbRepository = new DBRepository(this.preference);
        this.fileRepository = new FileRepository(this.preference);
        this.webRepository = new WebRepository(this.preference);
    }

    async load(search, flag, tag, folder, sortBy, sortOrder) {
        let entitiesResults = await this.dbRepository.entities(
            search,
            flag,
            tag,
            folder,
            sortBy,
            sortOrder
        );
        return entitiesResults;
    }

    async loadTags() {
        let tagsResults = await this.dbRepository.tags();
        return tagsResults;
    }

    async loadFolders() {
        let foldersResults = await this.dbRepository.folders();
        return foldersResults;
    }

    async add(urlList) {
        this.sharedState.set("viewState.processingQueueCount", this.sharedState.get("viewState.processingQueueCount") + urlList.length);
        let addPromise = async (url) => {
            try {
                var entity = await this.fileRepository.read(url);
                entity = await this.webRepository.fetch(entity);
                let moveSuccess = await this.fileRepository.move(entity);
                if (moveSuccess) {
                    let addSuccess = this.dbRepository.add(entity);
                    if (!addSuccess) {
                        await this.fileRepository.remove(entity);
                    }
                } else {
                    console.log("move file failed");
                }
            } catch (error) {
                console.log(error);
            }
        };
        let reuslts = await Promise.all(urlList.map((url) => addPromise(url)));
        this.sharedState.set("viewState.processingQueueCount", this.sharedState.get("viewState.processingQueueCount") - urlList.length);
        return reuslts
    }

    delete(ids) {
        let deletePromise = async (id) => {
            try {
                let entity = await this.dbRepository.entity(id);
                await this.fileRepository.remove(entity);
                await this.dbRepository.delete(entity);
            } catch (error) {
                console.log(error);
            }
        };

        Promise.all(ids.map((id) => deletePromise(id)));
    }

    async addSups(id, urlList) {
        var entity = await this.dbRepository.entity(id);
        entity = new PaperEntityDraft(entity);

        for (let url of urlList) {
            entity.supURLs.push(url);
        }

        this.update(entity);
    }

    deleteSup(entity, url) {
        try {
            this.fileRepository.removeFile(url);
            entity.supURLs = entity.supURLs.filter((supUrl) => supUrl !== url);
            this.dbRepository.update(entity);
        } catch (error) {
            console.log(error);
        }
    }

    deleteTag(tagName) {
        this.dbRepository.deleteTag(tagName);
    }

    deleteFolder(folderName) {
        this.dbRepository.deleteFolder(folderName);
    }

    flag(ids) {
        let flagPromise = async (id) => {
            try {
                var entity = await this.dbRepository.entity(id);
                entity = new PaperEntityDraft(entity);
                entity.flag = !entity.flag;

                this.dbRepository.update(entity);
            } catch (error) {
                console.log(error);
            }
        };

        Promise.all(ids.map((id) => flagPromise(id)));
    }

    async match(entities) {
        let matchPromise = async (entity) => {
            try {
                var entityDraft = new PaperEntityDraft(entity);
                entityDraft = await this.webRepository.fetch(entityDraft);

                this.update(entityDraft);
            } catch (error) {
                console.log(error);
            }
        };

        return await Promise.all(entities.map((entity) => matchPromise(entity)));
    }

    async update(entities) {
        this.sharedState.set("viewState.processingQueueCount", this.sharedState.get("viewState.processingQueueCount") + entities.length);
        let updatePromise = async (entity) => {
            try {
                await this.fileRepository.move(entity);
                await this.dbRepository.update(entity);
            } catch (error) {
                console.log(error);
            }
        };

        await Promise.all(entities.map((entity) => updatePromise(entity)));
        this.sharedState.set("viewState.processingQueueCount", this.sharedState.get("viewState.processingQueueCount") - entities.length);
    }

    _replacePublication(publication) {
        for (let kv of this.preference.get("exportReplacement")) {
            console.log(kv, publication);
            if (kv.from == publication) {
                return kv.to;
            }
        }
        return publication;
    }

    _exportBibtex(entities) {
        var allTexBib = "";

        for (let entity of entities) {
            var citeKey = "";
            citeKey += entity.authors.split(" ")[0] + "_";
            citeKey += entity.pubTime + "_";
            citeKey += formatString({
                str: entity.title.slice(0, 3),
                removeNewline: true,
                removeWhite: true,
                removeSymbol: true,
            });
            var texbib = "";
            if (entity.pubType == 1) {
                texbib = `@inproceedings{${citeKey},
    year = ${entity.pubTime},
    title = {${entity.title}},
    author = {${entity.authors.replace(", ", " and ")}},
    booktitle = {${this._replacePublication(entity.publication)}},
}`;
            } else {
                texbib = `@article{${citeKey},
    year = ${entity.pubTime},
    title = {${entity.title}},
    author = {${entity.authors.replace(", ", " and ")}},
    journal = {${this._replacePublication(entity.publication)}},
}`;
            }
            allTexBib += texbib + "\n\n";
        }
        return allTexBib;
    }

    _exportPlainText(entities) {
        var allPlain = "";

        for (let entity of entities) {
            let text = `${entity.authors}. \"${entity.title}\" In ${entity.publication}, ${entity.pubTime}. \n\n`;
            allPlain += text;
        }
        return allPlain;
    }

    export(ids, format) {
        let loadPromise = async (id) => {
            try {
                return await this.dbRepository.entity(id);
            } catch (error) {
                console.log(error);
                return null;
            }
        };

        Promise.all(ids.map((id) => loadPromise(id))).then((entities) => {
            var text;
            if (format === "bibtex") {
                text = this._exportBibtex(entities);
            } else {
                text = this._exportPlainText(entities);
            }
            clipboard.writeText(text);
        });
    }

    async listenRealmChange(callback) {
        try {
            let realm = await this.dbRepository.realm();
            realm.addListener("change", callback);
        } catch (error) {
            console.error(
                `An exception was thrown within the change listener: ${error}`
            );
        }
    }

    async saveSettings(settings) {
        if (settings.rematchInterval != this.preference.get("rematchInterval")) {
            this.setRoutineTimer();
        }

        var setNewDBFolder = false;
        if (
            settings.appLibFolder != this.preference.get("appLibFolder") ||
            ((settings.useSync != this.preference.get("useSync") ||
                settings.syncAPIKey != this.preference.get("syncAPIKey")) &&
                settings.syncAPIKey != "")
        ) {
            console.log("setNewDBFolder");
            setNewDBFolder = true;
        }
        this.preference.setAll(settings);

        if (setNewDBFolder) {
            await this.dbRepository.initRealm();
            if (
                settings.migrateLocalToSync &&
                settings.syncAPIKey != "" &&
                settings.useSync
            ) {
                console.log("migrateLocalToSync");
                await this.dbRepository.migrateLocaltoSync();
            }
            return true;
        } else {
            return false;
        }
    }

    appLibPath() {
        return this.preference.get("appLibFolder");
    }

    async routineMatch() {
        console.log("routineMatch");
        let allowRoutineMatch = this.preference.get("allowRoutineMatch");
        if (allowRoutineMatch) {
            this.preference.set("lastRematchTime", moment().unix());
            let entities = await this.dbRepository.preprintEntities();
            this.match(entities.map((entity) => entity.id));
        }
    }

    setRoutineTimer() {
        let rematchInterval = this.preference.get("rematchInterval");
        let lastRematchTime = this.preference.get("lastRematchTime");

        if (moment().unix() - lastRematchTime > 86400 * rematchInterval) {
            this.routineMatch();
        }

        if (this.scheduler == null) {
            this.scheduler = new ToadScheduler();
        } else {
            this.scheduler.stop();
            this.scheduler.removeById("rematch");
        }

        const task = new Task("rematch", () => {
            this.routineMatch();
        });

        const job = new SimpleIntervalJob(
            { seconds: 86400 * rematchInterval, runImmediately: false },
            task,
            "rematch"
        );

        this.scheduler.addSimpleIntervalJob(job);
    }

    // Preference
    loadPreferences() {
        return this.preference.store.store;
    }

    updatePreference(name, value) {
        this.preference.set(name, value);
        this.sharedState.set("viewState.preferenceUpdated", new Date().getTime());
    }
}
