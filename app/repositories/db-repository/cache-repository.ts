import { ObjectId } from "bson";
import { existsSync, promises } from "fs";
import md5 from "md5-file";
import path from "path";
// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import Realm, { PrimaryKey } from "realm";

import { PaperEntity } from "@/models/paper-entity";
import { PaperEntityCache, ThumbnailCache } from "@/models/paper-entity-cache";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { constructFileURL } from "@/utils/path";

import { IPaperEntityResults } from "./paper-entity-repository";

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
    window.logger.info("Initializing Cache DB...", "", false, "Database");

    if (this._realm || reinit) {
      Realm.defaultPath = await appService.userDataPath();
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
      window.logger.error(
        `Open local cache faild: ${err as string}`,
        "",
        false,
        "Database"
      );
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
      existsSync(
        path.join(
          window.appInteractor.getPreference("appLibFolder") as string,
          "cache.realm"
        )
      )
    ) {
      const userDataPath = await appService.userDataPath();
      try {
        if (path.join(userDataPath, "cache.realm")) {
          await promises.unlink(path.join(userDataPath, "cache.realm"));
        }
        if (path.join(userDataPath, "cache.realm.lock")) {
          await promises.unlink(path.join(userDataPath, "cache.realm.lock"));
        }
        if (path.join(userDataPath, "cache.realm.management")) {
          await promises.unlink(
            path.join(userDataPath, "cache.realm.management")
          );
        }
      } catch (err) {
        console.error(err);
      }
      try {
        await promises.rename(
          path.join(
            window.appInteractor.getPreference("appLibFolder") as string,
            "cache.realm"
          ),
          path.join(userDataPath, "cache.realm")
        );
      } catch (err) {
        console.error(err);
      }

      try {
        await promises.rename(
          path.join(
            window.appInteractor.getPreference("appLibFolder") as string,
            "cache.realm.lock"
          ),
          path.join(userDataPath, "cache.realm.lock")
        );
      } catch (err) {
        console.error(err);
      }

      try {
        await promises.rename(
          path.join(
            window.appInteractor.getPreference("appLibFolder") as string,
            "cache.realm.management"
          ),
          path.join(userDataPath, "cache.realm.management")
        );
      } catch (err) {
        console.error(err);
      }
    }

    const config = {
      schema: [PaperEntityCache.schema],
      schemaVersion: this._schemaVersion,
      path: path.join(await appService.userDataPath(), "cache.realm"),
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
  async fullTextFilter(query: string, paperEntities: IPaperEntityResults) {
    // First check if all the paper entities are already cached.
    try {
      await this.createFullText(paperEntities);
    } catch (err) {
      console.error(err);
    }

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
  async createFullText(paperEntities: IPaperEntityResults) {
    const realm = await this.realm();

    // 1. Pick out the entities that are not in the cache
    const ids = paperEntities.map((p) => p._id);

    const existObjs = realm
      .objects<PaperEntityCache>("PaperEntityCache")
      .filtered("_id IN $0", ids);
    const existObjIds = existObjs.map((e) => e._id);

    let noCachePaperEntities: IPaperEntityResults = [];

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
      const pdfWorker = new pdfjsWorker();
      pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;
    }

    const createPromise = async (paperEntity: PaperEntity) => {
      try {
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
      } catch (err) {
        console.error(err);
      }
    };
    await Promise.all(noCachePaperEntities.map((p) => createPromise(p)));
  }

  async updateFullText(paperEntities: IPaperEntityResults) {
    const realm = await this.realm();
    if (pdfjs.GlobalWorkerOptions.workerPort === null) {
      const pdfWorker = new pdfjsWorker();
      pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;
    }

    const updatePromise = async (paperEntity: PaperEntity) => {
      const fulltext = await this.getPDFText(paperEntity.mainURL);
      const filePath = (
        await window.appInteractor.access(paperEntity.mainURL, false)
      ).replace("file://", "");

      let md5String = "";
      if (filePath && (await promises.lstat(filePath)).isFile()) {
        md5String = await md5(filePath);
      }

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

    const filePath = (
      await window.appInteractor.access(paperEntity.mainURL, false)
    ).replace("file://", "");

    let md5String = "";
    if (filePath && (await promises.lstat(filePath)).isFile()) {
      md5String = await md5(filePath);
    }

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
      if (!url) {
        return "";
      }
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
        const pageTextList: string[] = [];
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
