import { ObjectId } from "bson";

import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IPaperEntityEntryScraperPayload {
  type: "paperEntity";
  value: PaperEntity;
}

export class PaperEntityEntryScraper extends AbstractEntryScraper {
  static validPayload(payload: any): boolean {
    if (!payload.hasOwnProperty("type") || payload.type !== "paperEntity") {
      return false;
    }

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
    payload: IPaperEntityEntryScraperPayload
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const paperEntityDraft = new PaperEntity(true);

    for (const p of Object.keys(payload.value)) {
      paperEntityDraft[p] = payload[p];
    }

    return [paperEntityDraft];
  }
}
