import { ObjectId } from "bson";

import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IPaperEntityEntryScraperPayload {
  _id: ObjectId | string;
  id: ObjectId | string;
  _partition: string;
  addTime: Date;
  title: string;
  authors: string;
  publication: string;
  pubTime: string;
  pubType: number;
  doi: string;
  arxiv: string;
  mainURL: string;
  supURLs: string[];
  rating: number;
  tags: PaperTag[];
  folders: PaperFolder[];
  flag: boolean;
  note: string;
  codes: string[];
  pages: string;
  volume: string;
  number: string;
  publisher: string;
}

export class PaperEntityEntryScraper extends AbstractEntryScraper {
  static validPayload(payload: any): boolean {
    let valid = true;

    for (const p of Object.keys(payload)) {
      if (p in PaperEntity.schema.properties) {
        continue;
      } else {
        valid = false;
        break;
      }
    }

    return valid;
  }
  static async scrape(
    payload: Partial<IPaperEntityEntryScraperPayload>
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const paperEntityDraft = new PaperEntity(true);

    for (const p of Object.keys(payload)) {
      paperEntityDraft[p] = payload[p];
    }

    return [paperEntityDraft];
  }
}
