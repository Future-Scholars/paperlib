import { Entry } from "bibtex-js-parser";
import { PaperEntityDraft } from "../models/PaperEntityDraft";

export function bibtex2entityDraft(
  bibtex: Entry,
  entityDraft: PaperEntityDraft
): PaperEntityDraft {
  if (bibtex.title) {
    entityDraft.title = bibtex.title;
  }
  if (bibtex.year) {
    entityDraft.pubTime = `${bibtex.year}`;
  }
  if (bibtex.author) {
    const authors = bibtex.author
      .split(" and ")
      .map((author) => {
        const first_last = author.split(",").map((author) => {
          return author.trim();
        });
        first_last.reverse();
        return first_last.join(" ");
      })
      .join(", ");
    entityDraft.authors = authors;
  }
  if (bibtex.type === "article") {
    if (
      bibtex.journal &&
      (entityDraft.publication === "" ||
        !bibtex.journal.toLowerCase().includes("arxiv"))
    ) {
      entityDraft.publication = bibtex.journal;
    }
    entityDraft.pubType = 0;
  } else if (
    bibtex.type === "inproceedings" ||
    bibtex.type === "incollection"
  ) {
    if (
      bibtex.booktitle &&
      (entityDraft.publication === "" ||
        !bibtex.booktitle.toLowerCase().includes("arxiv"))
    ) {
      entityDraft.publication = bibtex.booktitle;
    }
    entityDraft.pubType = 1;
  } else if (bibtex.type === "book") {
    if (
      bibtex.publisher &&
      (entityDraft.publication === "" ||
        !bibtex.publisher.toLowerCase().includes("arxiv"))
    ) {
      entityDraft.publication = bibtex.publisher;
    }
    entityDraft.pubType = 3;
  } else {
    if (
      bibtex.journal &&
      (entityDraft.publication === "" ||
        !bibtex.journal.toLowerCase().includes("arxiv"))
    ) {
      entityDraft.publication = bibtex.journal;
    }
    entityDraft.pubType = 2;
  }

  if (bibtex.pages) {
    entityDraft.pages = bibtex.pages;
  }
  if (bibtex.volume) {
    entityDraft.volume = bibtex.volume;
  }
  if (bibtex.number) {
    entityDraft.setValue("number", `${bibtex.number}`);
  }
  if (bibtex.publisher) {
    entityDraft.setValue("publisher", `${bibtex.publisher}`);
  }

  return entityDraft;
}
