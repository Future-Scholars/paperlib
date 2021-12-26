import { FileRepository } from "../repositories/FileRepository";
import { DBRepository } from "../repositories/DBRepository";
import { WebRepository } from "../repositories/WebRepository";
import { AppStore } from "../utils/appstate";
import { PaperEntityDraft } from "../models/PaperEntity";
import { clipboard } from "electron";
import { formatString } from "../utils/misc";

export class Interactor {
  constructor() {
    this.appStore = new AppStore();
    this.dbRepository = new DBRepository(this.appStore);
    this.fileRepository = new FileRepository(this.appStore);
    this.webRepository = new WebRepository(this.appStore);
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
    return await Promise.all(urlList.map((url) => addPromise(url)));
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

  deleteTag(tagId) {
    this.dbRepository.deleteTag(tagId);
  }

  deleteFolder(folderId) {
    this.dbRepository.deleteFolder(folderId);
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

  async match(ids) {
    let matchPromise = async (id) => {
      try {
        var entity = await this.dbRepository.entity(id);
        entity = new PaperEntityDraft(entity);
        await this.webRepository.fetch(entity);

        this.update(entity);
      } catch (error) {
        console.log(error);
      }
    };

    return await Promise.all(ids.map((id) => matchPromise(id)));
  }

  async update(entity) {
    let updatePromise = async () => {
      try {
        await this.fileRepository.move(entity);
        await this.dbRepository.update(entity);
      } catch (error) {
        console.log(error);
      }
    };
    await updatePromise();
  }

  _replacePublication(publication) {
    for (let kv of this.appStore.get("exportReplacement")) {
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

  loadSettings() {
    return this.appStore.getAll();
  }

  async saveSettings(settings) {
    var setNewDBFolder = false;
    if (
      settings.appLibFolder != this.appStore.get("appLibFolder") ||
      ((settings.useSync != this.appStore.get("useSync") ||
        settings.syncAPIKey != this.appStore.get("syncAPIKey")) &&
        settings.syncAPIKey != "")
    ) {
      console.log("setNewDBFolder");
      setNewDBFolder = true;
    }
    this.appStore.setAll(settings);

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
    return this.appStore.get("appLibFolder");
  }

  async addFromPlugin(url) {
    let addPromise = async (url) => {
      try {
        var entity = await this.fileRepository.read(url, true);
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
    return await addPromise(url);
  }
}
