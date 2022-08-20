import { PaperEntityDraft } from "../models/PaperEntityDraft";
// @ts-ignore
import Cite from "citation-js";

interface BibtexEntry {
  title: string;
  author: [{ given: string; family: string }];
  issued: {
    "date-parts": [[number]];
  };
  type: string;
  "container-title": string;
  publisher: string;
  page: string;
  volume: string;
  issue: string;
}

export function bibtex2entityDraft(
  bibtex: BibtexEntry,
  entityDraft: PaperEntityDraft
): PaperEntityDraft {
  if (bibtex.title) {
    entityDraft.title = bibtex.title;
  }

  if (bibtex.author) {
    const authors = bibtex.author
      .map((author) => {
        return [author.given, author.family].join(" ");
      })
      .join(", ");
    entityDraft.authors = authors;
  }

  if (bibtex.issued) {
    if (bibtex.issued["date-parts"][0][0]) {
      entityDraft.pubTime = `${bibtex.issued["date-parts"][0][0]}`;
    }
  }

  if (bibtex["container-title"]) {
    const publication = bibtex["container-title"];
    if (
      entityDraft.publication === "" ||
      (!publication.toLowerCase().includes("arxiv") &&
        entityDraft.publication.toLowerCase().includes("arxiv"))
    ) {
      entityDraft.publication = publication;
    }
  }

  if (bibtex.type === "article-journal") {
    entityDraft.pubType = 0;
  } else if (bibtex.type === "paper-conference" || bibtex.type === "chapter") {
    entityDraft.pubType = 1;
  } else if (bibtex.type === "book") {
    entityDraft.pubType = 3;
  } else {
    entityDraft.pubType = 2;
  }

  if (bibtex.page) {
    entityDraft.pages = `${bibtex.page}`;
  }
  if (bibtex.volume) {
    entityDraft.volume = `${bibtex.volume}`;
  }
  if (bibtex.issue) {
    entityDraft.setValue("number", `${bibtex.issue}`);
  }
  if (bibtex.publisher) {
    entityDraft.setValue("publisher", `${bibtex.publisher}`);
  }

  return entityDraft;
}

export function bibtexes2entityDrafts(
  bibtexes: BibtexEntry[],
  entityDrafts: PaperEntityDraft[]
): PaperEntityDraft | PaperEntityDraft[] {
  // Assert bibtex and entityDraft are both arrays or not
  if (Array.isArray(bibtexes) && Array.isArray(entityDrafts)) {
    console.error("Bibtex and EntityDraft must be both arrays or not");
    return entityDrafts;
  }
  return bibtexes.map((bib, index) => {
    return bibtex2entityDraft(bib, entityDrafts[index]);
  });
}

export function bibtex2json(bibtex: string): BibtexEntry[] {
  return Cite(bibtex).data;
}
