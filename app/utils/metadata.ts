import { PaperEntity } from "@/models/paper-entity";

export function isMetadataCompleted(paperEntityDraft: PaperEntity): boolean {
  const completed =
    paperEntityDraft.title != "" &&
    paperEntityDraft.title.toLowerCase() != "undefined" &&
    paperEntityDraft.title.toLowerCase() != "untitled" &&
    paperEntityDraft.authors != "" &&
    paperEntityDraft.publication != "" &&
    paperEntityDraft.pubTime != "" &&
    !isPreprint(paperEntityDraft);

  return completed;
}

export function isPreprint(paperEntityDraft: PaperEntity) {
  const lowercasedPublication = paperEntityDraft.publication.toLowerCase();
  return (
    lowercasedPublication.includes("arxiv") ||
    lowercasedPublication.includes("biorxiv") ||
    lowercasedPublication.includes("medrxiv") ||
    lowercasedPublication.includes("chemrxiv") ||
    lowercasedPublication.includes("openreview") ||
    lowercasedPublication.includes("corr") ||
    lowercasedPublication === "" ||
    lowercasedPublication === "undefined"
  );
}

export function mergeMetadata(
  originPaperEntityDraft: PaperEntity,
  paperEntityDraft: PaperEntity,
  scrapedpaperEntity: PaperEntity,
  mergePriorityLevel: { [key: string]: number },
  scraperIndex: number
): {
  paperEntityDraft: PaperEntity;
  mergePriorityLevel: { [key: string]: number };
} {
  if (
    isPreprint(paperEntityDraft) ||
    (!isPreprint(scrapedpaperEntity) && !isPreprint(paperEntityDraft))
  ) {
    for (const key of Object.keys(scrapedpaperEntity)) {
      if (
        scrapedpaperEntity[key] &&
        scrapedpaperEntity[key] !== "" &&
        mergePriorityLevel[key] > scraperIndex &&
        originPaperEntityDraft[key] !== scrapedpaperEntity[key]
      ) {
        paperEntityDraft[key] = scrapedpaperEntity[key];
        mergePriorityLevel[key] = scraperIndex;
      }
    }
  }

  return { paperEntityDraft, mergePriorityLevel };
}
