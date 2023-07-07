import { PaperEntity } from "@/models/paper-entity";

export abstract class AbstractEntryScraper {
  static validPayload: (payload: any) => boolean;
  static scrape: (payload: any) => Promise<PaperEntity[]>;
}
