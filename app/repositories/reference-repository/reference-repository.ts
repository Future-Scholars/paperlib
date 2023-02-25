// @ts-ignore
import Cite from "citation-js";
import { existsSync, readFileSync } from "fs";
import path from "path";

import { CSL } from "@/models/csl";
import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { formatString } from "@/utils/string";

function escapeLaTexString(str: string) {
  const out = str.replaceAll("&", "\\&").replaceAll("%", "\\%").replaceAll("#", "\\#");
  return out
}

export class ReferenceRepository {
  stateStore: MainRendererStateStore;
  preference: Preference;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.setCitePlugin();
  }

  setCitePlugin() {
    const parseSingle = (paperEntityDraft: PaperEntity) => {
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
          word.toLocaleLowerCase() !== "a" || word.toLocaleLowerCase() !== "an" || word.length <= 3
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
        id: `${paperEntityDraft.id}`,
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

    const parseMulti = (paperEntityDrafts: PaperEntity[]) => {
      return paperEntityDrafts.map((paperEntityDraft) => {
        return parseSingle(paperEntityDraft);
      });
    };

    const predicateSingle = (paperEntityDraft: PaperEntity) => {
      return paperEntityDraft.codes !== undefined;
    };

    const predicateMulti = (paperEntityDrafts: PaperEntity[]) => {
      if (!!paperEntityDrafts?.[Symbol.iterator]) {
        return paperEntityDrafts.every((paperEntityDraft) => {
          return paperEntityDraft.codes !== undefined;
        });
      } else {
        return false;
      }
    };

    Cite.plugins.input.add("@paperlib/PaperEntity", {
      parse: parseSingle,
      parseType: {
        predicate: predicateSingle,
        dataType: "ComplexObject",
      },
    });
    Cite.plugins.input.add("@paperlib/PaperEntity[]", {
      parse: parseMulti,
      parseType: {
        predicate: predicateMulti,
        dataType: "Array",
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

  replacePublication(source: PaperEntity) {
    if (this.preference.get("enableExportReplacement")) {
      const pubReplacement = this.preference.get("exportReplacement") as [
        { from: string; to: string }
      ];

      const pubMap = new Map(
        pubReplacement.map((item) => [item.from, item.to])
      );

      if (pubMap.has(source.publication)) {
        source.publication = pubMap.get(source.publication) as string;
      }
    }
    return source;
  }

  toCite(source: PaperEntity | PaperEntity[] | string) {
    if (typeof source === "string") {
      return new Cite(source);
    } else if (source.constructor.name === "PaperEntity") {
      return new Cite(this.replacePublication(source as PaperEntity));
    } else {
      return new Cite(
        (source as PaperEntity[]).map((item) => this.replacePublication(item))
      );
    }
  }

  exportBibTexKey(cite: Cite): string {
    return cite.format("bibtex-key");
  }

  exportBibTexBody(cite: Cite): string {

    const mathEnvStrs = []
    let idx = 0;
    for (const i in cite.data) {
      let title = cite.data[i].title
      const envRegex = /\$(.*?)\$/g;
      const envs = title.match(envRegex);
      if (envs) {
        for (const env of envs) {
          mathEnvStrs.push(env)
          title = title.replace(env, `MATHENVDOLLAR{i}`);
          idx += 1;
        }
        cite.data[i].title = title;
      }
    }

    let bibtexBody = escapeLaTexString(cite.format("bibtex"));

    for (const i in mathEnvStrs) {
      bibtexBody = bibtexBody.replace(`MATHENVDOLLAR{i}`, mathEnvStrs[i]).replace(`{MATHENVDOLLAR}{i}`, mathEnvStrs[i]);
    }

    return bibtexBody;
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
          const template = readFileSync(templatePath, "utf8");
          config.templates.add(csl, template);
        }

        return cite.format("bibliography", { template: csl });
      } else {
        this.stateStore.logState.alertLog = `CSL template file: ${csl}.csl not found.`;
        return cite.format("bibliography", { template: "apa" });
      }
    }
  }
}
