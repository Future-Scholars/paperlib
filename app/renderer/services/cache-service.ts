import { ObjectId } from "bson";
import { promises } from "fs";
import md5 from "md5-file";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { PrimaryKey, Results } from "realm";

import {
  CacheDatabaseCore,
  ICacheDatabaseCore,
} from "@/base/database/cache-core";
import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";
import { constructFileURL, eraseProtocol } from "@/base/url";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { OID } from "@/models/id";
import { PaperEntity } from "@/models/paper-entity";
import { PaperEntityCache, ThumbnailCache } from "@/models/paper-entity-cache";
import { FileService, IFileService } from "@/renderer/services/file-service";
import { ILogService, LogService } from "@/renderer/services/log-service";
import { ProcessingKey, processing } from "@/renderer/services/uistate-service";
import {
  IPaperEntityCollection,
  IPaperEntityObject,
} from "@/repositories/db-repository/paper-entity-repository";

export const ICacheService = createDecorator("cacheService");

export class CacheService {
  constructor(
    @ICacheDatabaseCore private readonly _cacheDatabaseCore: CacheDatabaseCore,
    @IFileService private readonly _fileService: FileService,
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
  ) {}

  /**
   * Initialize the database.
   * @param reinit - Whether to reinitialize the database. */
  async initialize(reinit: boolean = true) {
    await this._cacheDatabaseCore.initRealm(reinit);
  }

  // ========================
  // Read
  // ========================
  /**
   * Filter the fulltext cache of the provided papers by the given query.
   * @param query - The query to filter the fulltext cache by.
   * @param paperEntities - The paper entities to filter.
   * @returns The filtered paper entities. */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to filter fulltext cache.", true, "CacheService", [])
  async fullTextFilter(query: string, paperEntities: IPaperEntityCollection) {
    // First check if all the paper entities are already cached.
    try {
      await this._createFullText(paperEntities);
    } catch (error) {
      this._logService.error(
        `Create fulltext cache failed`,
        error as Error,
        true,
        "CacheService"
      );
    }

    const realm = await this._cacheDatabaseCore.realm();

    const ids = realm
      .objects<PaperEntityCache>("PaperEntityCache")
      .filtered(query)
      .map((p) => p._id);

    const filteredPaperEntities = (
      paperEntities as Results<IPaperEntityObject>
    ).filtered(`_id IN $0`, ids);

    return filteredPaperEntities;
  }

  /**
   * Get the thumbnail of the paper entity.
   * @param paperEntity - The paper entity to get the thumbnail of.
   * @returns The thumbnail of the paper entity. */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to get thumbnail.", true, "CacheService", null)
  async loadThumbnail(
    paperEntity: PaperEntity
  ): Promise<ThumbnailCache | null> {
    const realm = await this._cacheDatabaseCore.realm();

    const cache = realm.objectForPrimaryKey<PaperEntityCache>(
      "PaperEntityCache",
      new ObjectId(paperEntity.id) as unknown as PrimaryKey
    );

    if (cache && cache.thumbnail) {
      return {
        blob: cache.thumbnail,
        width: cache.thumbnailWidth || 0,
        height: cache.thumbnailHeight || 0,
      };
    } else {
      return null;
    }
  }

  // ========================
  // Create and Update
  // ========================
  private async _createFullText(paperEntities: IPaperEntityCollection) {
    const realm = await this._cacheDatabaseCore.realm();

    // 1. Pick out the entities that are not in the cache
    const ids = paperEntities.map((p: PaperEntity) => p._id);

    const existObjs = realm
      .objects<PaperEntityCache>("PaperEntityCache")
      .filtered("_id IN $0", ids);
    const existObjIds = existObjs.map((e) => e._id);

    let noCachePaperEntities: IPaperEntityCollection = [];

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
    if (GlobalWorkerOptions.workerPort === null) {
      const pdfWorker = new Worker(
        new URL(
          "../../../node_modules/pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url
        ),
        { type: "module" }
      );
      GlobalWorkerOptions.workerPort = pdfWorker;
    }

    const createPromise = async (paperEntity: PaperEntity) => {
      try {
        if (!paperEntity.mainURL) {
          return;
        }
        const fulltext = await this._getPDFText(paperEntity.mainURL);
        const md5String = await md5(
          eraseProtocol(
            await this._fileService.access(paperEntity.mainURL, false)
          )
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
        this._logService.error(
          "Failed to create fulltext cache",
          err as Error,
          false,
          "CacheService"
        );
      }
    };
    await Promise.all(
      noCachePaperEntities.map((p: PaperEntity) => createPromise(p))
    );
  }

  private async _getPDFText(url: string): Promise<string> {
    try {
      if (!url) {
        return "";
      }
      const pdf = await getDocument(
        constructFileURL(
          url,
          true,
          true,
          this._preferenceService.get("appLibFolder") as string
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
      this._logService.error(
        "Failed to read fulltext of PDF",
        error as Error,
        false,
        "CacheService"
      );

      return "";
    }
  }

  /**
   * Update the fulltext cache of the provided paper entities.
   * @param paperEntities - The paper entities to update the fulltext cache of.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update fulltext cache.", true, "CacheService")
  async updateFullTextCache(paperEntities: IPaperEntityCollection) {
    const realm = await this._cacheDatabaseCore.realm();
    if (GlobalWorkerOptions.workerPort === null) {
      const pdfWorker = new Worker(
        new URL(
          "../../../node_modules/pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url
        ),
        { type: "module" }
      );
      GlobalWorkerOptions.workerPort = pdfWorker;
    }

    const updatePromise = async (paperEntity: PaperEntity) => {
      const filePath = eraseProtocol(
        await this._fileService.access(paperEntity.mainURL, false)
      );

      if (!filePath) {
        return;
      }

      let md5String = "";
      if (filePath && (await promises.lstat(filePath)).isFile()) {
        md5String = await md5(filePath);
      }

      const fulltext = await this._getPDFText(paperEntity.mainURL);
      return realm.safeWrite(() => {
        const objects = realm
          .objects<PaperEntityCache>("PaperEntityCache")
          .filtered("_id == $0", new ObjectId(paperEntity._id));
        const object = objects[0] || null;

        if (object && object.md5 === md5String) {
          return;
        } else if (object) {
          object.fulltext = fulltext;
          object.md5 = md5String;
        } else {
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
        }
      });
    };

    await Promise.all(paperEntities.map((p: PaperEntity) => updatePromise(p)));
  }

  /**
   * Update the thumbnail cache
   * @param paperEntity - PaperEntity
   * @param thumbnailCache - Cache of thumbnail
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update thumbnail cache.", true, "CacheService")
  async updateThumbnailCache(
    paperEntity: PaperEntity,
    thumbnailCache: ThumbnailCache
  ) {
    const realm = await this._cacheDatabaseCore.realm();

    const filePath = eraseProtocol(
      await this._fileService.access(paperEntity.mainURL, false)
    );

    realm.safeWrite(() => {
      const objects = realm
        .objects<PaperEntityCache>("PaperEntityCache")
        .filtered("_id == $0", new ObjectId(paperEntity.id));
      const object = objects[0] || null;

      if (object) {
        object.thumbnail = thumbnailCache.blob;
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
          md5: "",
        });
      }
    });
  }

  /**
   * Update the cache of the provided paper entities.
   * @param paperEntities - The paper entities.
   * @returns
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to update cache.", true, "CacheService")
  async updateCache(paperEntities: IPaperEntityCollection) {
    await this.updateFullTextCache(paperEntities);
    for (const paperEntity of paperEntities) {
      await this.updateThumbnailCache(paperEntity, {
        blob: new ArrayBuffer(0),
        width: 0,
        height: 0,
      });
    }
  }

  // ========================
  // Delete
  // ========================
  /**
   * Delete the cache of the provided paper entity ids.
   * @param ids - The ids of the paper entities to delete the cache of.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to delete cache.", true, "CacheService")
  async delete(ids: OID[]) {
    const realm = await this._cacheDatabaseCore.realm();

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

  /**
   * Clear the cache.
   */
  @processing(ProcessingKey.General)
  @errorcatching("Failed to clear cache.", true, "CacheService")
  async clear() {
    const realm = await this._cacheDatabaseCore.realm();
    realm.safeWrite(() => {
      realm.delete(realm.objects<PaperEntityCache>("PaperEntityCache"));
    });
  }
}
