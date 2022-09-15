import { ObjectId } from "bson";
import { existsSync, promises } from "fs";
import md5 from "md5-file";
import path from "path";
// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import Realm, { PrimaryKey } from "realm";

import { PaperEntity } from "@/models/paper-entity";
import { PaperEntityCache, ThumbnailCache } from "@/models/paper-entity-cache";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { constructFileURL } from "@/utils/path";

import { PaperEntityResults } from "./paper-entity-repository";

export class CacheRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  _realm?: Realm;
  _schemaVersion: number;

  app?: Realm.App;
  config?: Realm.Configuration;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this._schemaVersion = 2;
  }

  async realm(): Promise<Realm> {
    if (!this._realm) {
      await this.initRealm(true);
    }
    return this._realm as Realm;
  }

  // ========================
  // Initialize
  // ========================
  async initRealm(reinit = false): Promise<Realm> {
    this.stateStore.viewState.processingQueueCount += 1;
    this.stateStore.logState.processLog = "Cache Initializing...";

    if (this._realm || reinit) {
      Realm.defaultPath = window.appInteractor.getUserDataPath();
      if (this._realm) {
        this._realm.close();
      }
      this._realm = undefined;
      this.app = undefined;
      this.config = undefined;
    }

    if (this._realm) {
      return this._realm;
    }

    await this.getConfig();

    try {
      this._realm = new Realm(this.config);
    } catch (err) {
      console.error(err);
      this.stateStore.logState.alertLog = `Open local cache faild: ${
        err as string
      }`;
    }

    this._realm!.safeWrite = (callback) => {
      if (this._realm!.isInTransaction) {
        return callback();
      } else {
        return this._realm!.write(callback);
      }
    };

    this.stateStore.viewState.processingQueueCount -= 1;
    return this._realm!;
  }

  async getConfig(): Promise<Realm.Configuration> {
    if (
      !existsSync(window.appInteractor.getPreference("appLibFolder") as string)
    ) {
      await promises.mkdir(
        window.appInteractor.getPreference("appLibFolder") as string,
        {
          recursive: true,
        }
      );
    }

    const config = {
      schema: [PaperEntityCache.schema],
      schemaVersion: this._schemaVersion,
      path: path.join(
        window.appInteractor.getPreference("appLibFolder") as string,
        "cache.realm"
      ),
    };
    this.config = config;
    return config;
  }

  // ======================================
  // CRUD
  // ======================================

  // ========================
  // Read
  // ========================
  async fullTextFilter(query: string, paperEntities: PaperEntityResults) {
    // First check if all the paper entities are already cached.
    await this.createFullText(paperEntities);

    const realm = await this.realm();

    const ids = realm
      .objects<PaperEntityCache>("PaperEntityCache")
      .filtered(`(fulltext contains[c] \"${query}\")`)
      .map((p) => p._id);

    const filteredPaperEntities = (
      paperEntities as Realm.Results<PaperEntity & Realm.Object>
    ).filtered(`_id IN $0`, ids);

    return filteredPaperEntities;
  }

  async thumbnail(paperEntity: PaperEntity) {
    const realm = await this.realm();

    const cache = realm.objectForPrimaryKey<PaperEntityCache>(
      "PaperEntityCache",
      new ObjectId(paperEntity.id) as unknown as PrimaryKey
    );

    if (cache && cache.thumbnail) {
      return {
        blob: cache.thumbnail,
        width: cache.thumbnailWidth,
        height: cache.thumbnailHeight,
      };
    } else {
      return null;
    }
  }
  // ========================
  // Create and Update
  // ========================
  async createFullText(paperEntities: PaperEntityResults) {
    const realm = await this.realm();

    // 1. Pick out the entities that are not in the cache
    const ids = paperEntities.map((p) => p._id);

    const existObjs = realm
      .objects<PaperEntityCache>("PaperEntityCache")
      .filtered("_id IN $0", ids);
    const existObjIds = existObjs.map((e) => e._id);

    let noCachePaperEntities: PaperEntityResults = [];

    if (paperEntities instanceof Realm.Results) {
      noCachePaperEntities = paperEntities.filtered(
        `NOT (_id IN $0)`,
        existObjIds
      );
    } else {
      const existObjStrIds = existObjIds.map((id) => `${id}`);
      noCachePaperEntities = paperEntities.filter(
        (p) => !existObjStrIds.includes(`${p._id}`)
      );
    }
    // 2. Update the cache
    if (pdfjs.GlobalWorkerOptions.workerPort === null) {
      const pdfWorker = new Worker("./pdf.worker.min.js");
      pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;
    }

    const createPromise = async (paperEntity: PaperEntity) => {
      const fulltext = await this.getPDFText(paperEntity.mainURL);
      const md5String = await md5(
        (
          await window.appInteractor.access(paperEntity.mainURL, false)
        ).replace("file://", "")
      );
      realm.safeWrite(() => {
        realm.create<PaperEntityCache>("PaperEntityCache", {
          _id: new ObjectId(paperEntity._id),
          _partition: "",
          fulltext: fulltext,
          md5: md5String,
        });
      });
    };
    await Promise.all(noCachePaperEntities.map((p) => createPromise(p)));
  }

  async updateFullText(paperEntities: PaperEntityResults) {
    const realm = await this.realm();
    if (pdfjs.GlobalWorkerOptions.workerPort === null) {
      const pdfWorker = new Worker("./pdf.worker.min.js");
      pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;
    }

    const updatePromise = async (paperEntity: PaperEntity) => {
      const fulltext = await this.getPDFText(paperEntity.mainURL);
      const md5String = await md5(
        (
          await window.appInteractor.access(paperEntity.mainURL, false)
        ).replace("file://", "")
      );
      realm.safeWrite(() => {
        realm.create<PaperEntityCache>(
          "PaperEntityCache",
          {
            _id: new ObjectId(paperEntity._id),
            _partition: "",
            fulltext: fulltext,
            md5: md5String,
          },
          Realm.UpdateMode.Modified
        );
      });
    };

    await Promise.all(paperEntities.map((p) => updatePromise(p)));
  }

  async updateThumbnail(
    paperEntity: PaperEntity,
    thumbnailCache: ThumbnailCache
  ) {
    const realm = await this.realm();

    const md5String = await md5(
      (
        await window.appInteractor.access(paperEntity.mainURL, false)
      ).replace("file://", "")
    );

    realm.safeWrite(() => {
      const object = realm.objectForPrimaryKey<PaperEntityCache>(
        "PaperEntityCache",
        new ObjectId(paperEntity.id) as unknown as PrimaryKey
      );

      if (object) {
        object.thumbnail = thumbnailCache.blob;
        object.md5 = md5String;
        object.thumbnailWidth = thumbnailCache.width;
        object.thumbnailHeight = thumbnailCache.height;
      } else {
        realm.create<PaperEntityCache>("PaperEntityCache", {
          _id: new ObjectId(paperEntity.id),
          _partition: "",
          fulltext: "",
          thumbnail: thumbnailCache.blob,
          thumbnailWidth: thumbnailCache.width,
          thumbnailHeight: thumbnailCache.height,
          md5: md5String,
        });
      }
    });
  }

  async getPDFText(url: string): Promise<string> {
    try {
      const pdf = await pdfjs.getDocument(
        constructFileURL(
          url,
          true,
          true,
          this.preference.get("appLibFolder") as string
        )
      ).promise;

      let text = "";

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const pageText = await page.getTextContent({
          // @ts-ignore
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        });
        const pageTextList = [];
        for (const item of pageText.items) {
          pageTextList.push((item as TextItem).str);
        }
        text += ` ${pageTextList.join(" ")}`;
      }

      return text;
    } catch (error) {
      console.log(error);
      return "";
    }
  }

  // ========================
  // Delete
  // ========================
  async delete(ids: (string | ObjectId)[]) {
    const realm = await this.realm();

    const entitiesCache = realm
      .objects<PaperEntityCache>("PaperEntityCache")
      .filtered(
        "_id IN $0",
        ids.map((id) => new ObjectId(id))
      );

    realm.safeWrite(() => {
      realm.delete(entitiesCache);
    });
  }

  // ========================
  // Dev Function
  // ========================

  async removeAll() {
    const realm = await this.realm();
    const objects = realm.objects<PaperEntityCache>("PaperEntityCache");
    realm.safeWrite(() => {
      realm.delete(objects);
    });
  }
}
