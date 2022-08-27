// @ts-ignore
import Cite from "citation-js";
import { existsSync, readFile } from "fs-extra";
import path from "path";

import { CSL } from "../../models/CSL";
import { Preference } from "../../utils/preference";
import { PaperEntityDraft } from "../../models/PaperEntityDraft";
import { SharedState } from "../../utils/appstate";
import { formatString } from "../../utils/string";

export class ReferenceRepository {
  sharedState: SharedState;
  preference: Preference;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.setCitePlugin();
  }

  setCitePlugin() {
    const parseSingle = (paperEntityDraft: PaperEntityDraft) => {
      let nameArray;
      if (paperEntityDraft.authors.includes(";")) {
        nameArray = paperEntityDraft.authors.split(";");
      } else {
        nameArray = paperEntityDraft.authors.split(",");
      }
      nameArray = nameArray.map((name) => {
        name = name.trim();
        const nameParts = name.split(" ");
        const given = nameParts.slice(0, nameParts.length - 1).join(" ");
        const family = nameParts[nameParts.length - 1];

        return {
          given: given,
          family: family,
        };
      });

      let citeKey = "";
      if (nameArray.length >= 1) {
        citeKey += nameArray[0].family.toLowerCase();
      }
      citeKey += paperEntityDraft.pubTime;
      const titleArray = paperEntityDraft.title.split(" ");
      for (const word of titleArray) {
        if (
          word.toLocaleLowerCase() !== "the" ||
          word.toLocaleLowerCase() !== "a"
        ) {
          citeKey += formatString({
            str: word.toLowerCase(),
            removeNewline: true,
            removeSymbol: true,
            removeWhite: true,
            trimWhite: true,
          });
          break;
        }
      }
      return {
        id: paperEntityDraft.id,
        type: ["article", "paper-conference", "article", "book"][
          paperEntityDraft.pubType
        ],
        "citation-key": citeKey,
        title: paperEntityDraft.title,
        author: nameArray,
        issued: {
          "date-parts": [[paperEntityDraft.pubTime]],
        },
        "container-title": paperEntityDraft.publication,
        publisher: paperEntityDraft.publisher,
        page: paperEntityDraft.pages,
        volume: paperEntityDraft.volume,
        issue: paperEntityDraft.number,
        DOI: paperEntityDraft.doi,
      };
    };

    const predicateSingle = (paperEntityDraft: PaperEntityDraft) => {
      return paperEntityDraft.constructor.name === "PaperEntityDraft";
    };

    const parseMulti = (paperEntityDrafts: PaperEntityDraft[]) => {
      return paperEntityDrafts.map((paperEntityDraft) => {
        return parseSingle(paperEntityDraft);
      });
    };

    const predicateMulti = (paperEntityDrafts: PaperEntityDraft[]) => {
      return paperEntityDrafts.every((paperEntityDraft) => {
        return paperEntityDraft.constructor.name === "PaperEntityDraft";
      });
    };

    Cite.plugins.input.add("@paperlib/PaperEntityDraft", {
      parse: parseSingle,
      parseType: {
        predicate: predicateSingle,
        dataType: "ComplexObject",
      },
    });
    Cite.plugins.input.add("@paperlib/PaperEntityDraft[]", {
      parse: parseMulti,
      parseType: {
        predicate: predicateMulti,
        dataType: "ComplexObject",
      },
    });

    Cite.plugins.output.add("bibtex-key", (csls: CSL[]) => {
      return csls
        .map((csl) => {
          return csl["citation-key"];
        })
        .join(", ");
    });
  }

  toCite(source: PaperEntityDraft | PaperEntityDraft[] | string) {
    return new Cite(source);
  }

  exportBibTexKey(cite: Cite): string {
    return cite.format("bibtex-key");
  }

  exportBibTexBody(cite: Cite): string {
    return cite.format("bibtex");
  }

  async exportPlainText(cite: Cite): Promise<string> {
    const csl = this.preference.get("selectedCSLStyle") as string;

    if (["apa", "vancouver", "harvard1"].includes(csl)) {
      return cite.format("bibliography", { template: csl });
    } else {
      let templatePath = path.join(
        this.preference.get("importedCSLStylesPath") as string,
        csl + ".csl"
      );

      let config = Cite.plugins.config.get("@csl");
      if (existsSync(templatePath)) {
        if (!config.templates.has(csl)) {
          const template = await readFile(templatePath, "utf8");
          config.templates.add(csl, template);
        }

        return cite.format("bibliography", { template: csl });
      } else {
        this.sharedState.set(
          "viewState.alertInformation",
          `CSL template file: ${csl}.csl not found.`
        );
        return cite.format("bibliography", { template: "apa" });
      }
    }
  }
}
