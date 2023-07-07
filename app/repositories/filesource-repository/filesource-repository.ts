import { createDecorator } from "@/base/injection/injection";
import { PaperEntity } from "@/models/paper-entity";

import { ArXivFileSource } from "./sources/arxiv";
import { SemanticScholarFileSource } from "./sources/semanticscholar";
import { FileSource } from "./sources/source";
import { UnpayWallFileSource } from "./sources/unpaywall";
import { XHubFileSource } from "./sources/xhub";

const FILESOURCE_OBJS = new Map<string, typeof FileSource>([
  ["arxiv", ArXivFileSource],
  ["x-hub", XHubFileSource],
  ["unpaywall", UnpayWallFileSource],
  ["semanticscholar", SemanticScholarFileSource],
]);

export const IFileSourceRepository = createDecorator("fileSourceRepository");

export class FileSourceRepository {
  constructor() {}

  async download(
    entityDraft: PaperEntity,
    fileSources: string[] = []
  ): Promise<{ paperEntityDraft: PaperEntity; errors: Error[] }> {
    const errors: Error[] = [];

    for (const fileSource of fileSources) {
      try {
        const entityDraftOrNull = await FILESOURCE_OBJS.get(
          fileSource
        )?.download(entityDraft);
        if (entityDraftOrNull) {
          return { paperEntityDraft: entityDraftOrNull, errors };
        }
      } catch (error) {
        errors.push(error as Error);
      }
    }

    return { paperEntityDraft: entityDraft, errors };
  }
}
