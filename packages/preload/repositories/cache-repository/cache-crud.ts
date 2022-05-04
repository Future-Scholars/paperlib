// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
import { ObjectId } from "bson";

import { PaperEntity } from "../../models/PaperEntity";
import { PaperEntityCache } from "../../models/PaperEntityCache";

import { CacheRepository } from "./cache-repository";

import { constructFileURL } from "../../utils/path";

import { TextItem } from "pdfjs-dist/types/src/display/api";

// ============================================================
// Update & Add
export async function update(this: CacheRepository, entities: PaperEntity[]) {
  const cache = this.cache();

  // 1. Pick out the entities that are not in the cache
  const idsQuery = entities
    .map((e) => `_id == oid(${e.id as string})`)
    .join(" OR ");

  const existObjs = cache
    .objects<PaperEntityCache>("PaperEntityCache")
    .filtered(idsQuery);
  const existObjIds = existObjs.map((e) => e._id.toString());

  const newObjs = entities.filter(
    (e) => !existObjIds.includes(e._id.toString())
  );

  if (newObjs.length > 3) {
    this.sharedState.set("viewState.processingQueueCount", newObjs.length);
    this.sharedState.set(
      "viewState.alertInformation",
      `${newObjs.length} new papers are indexing, please wait for a while...`
    );
  }

  // 2. Update the cache
  const pdfWorker = new Worker("/src/workers/pdf.worker.min.js");
  pdfjs.GlobalWorkerOptions.workerPort = pdfWorker;

  for (const obj of newObjs) {
    const fulltext = await this.getPDFText(obj.mainURL);
    cache.write(() => {
      cache.create<PaperEntityCache>("PaperEntityCache", {
        _id: new ObjectId(obj._id),
        _partition: "",
        fulltext: fulltext,
      });
    });
  }
  pdfWorker.terminate();

  this.sharedState.set(
    "viewState.processingQueueCount",
    (this.sharedState.viewState.processingQueueCount.get() as number) -
      newObjs.length
  );
}

export async function getPDFText(
  this: CacheRepository,
  url: string
): Promise<string> {
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

export async function fullTextFilter(
  this: CacheRepository,
  query: string,
  entities: PaperEntity[]
) {
  await this.update(entities);

  const cache = this.cache();
  const ids = cache
    .objects<PaperEntityCache>("PaperEntityCache")
    .filtered(`(fulltext contains[c] \"${query}\")`)
    .map((e) => e._id.toString());

  return entities.filter((e) => ids.includes(e._id as string));
}

export function remove(this: CacheRepository, ids: string[]) {
  const cache = this.cache();

  const idsQuery = ids.map((id) => `_id == oid(${id})`).join(" OR ");

  const entitiesCache = cache
    .objects<PaperEntityCache>("PaperEntityCache")
    .filtered(`(${idsQuery})`);

  cache.write(() => {
    cache.delete(entitiesCache);
  });
}
