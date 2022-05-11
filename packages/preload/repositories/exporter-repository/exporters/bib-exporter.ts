import { Preference } from "../../../utils/preference";
import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { Exporter } from "./exporter";
import { formatString } from "../../../utils/string";

export class BibExporter extends Exporter {
  constructor(preference: Preference) {
    super(preference);
  }

  export(entityDrafts: PaperEntityDraft[]): string {
    let allTexBib = "";

    for (const entity of entityDrafts) {
      let citeKey = "";
      const nameArray = entity.authors.split(", ")[0].split(" ");
      const lastName = nameArray[nameArray.length - 1];
      citeKey += lastName.toLowerCase();
      citeKey += entity.pubTime;
      const titleArray = entity.title.split(" ");
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

      const pubDetails = {
        volume: entity.volume,
        number: entity.number,
        pages: entity.pages,
        publisher: entity.publisher,
      };
      let pubDetailStrList = [];
      for (let [key, value] of Object.entries(pubDetails)) {
        if (value) {
          if (key === "pages") {
            value = value.replaceAll("-", "--");
          }
          pubDetailStrList.push(`    ${key} = {${value}}`);
        }
      }
      const pubDetailStr = pubDetailStrList.join(",\n");

      let texbib = "";
      if (entity.pubType == 1) {
        texbib = `@inproceedings{${citeKey},
    year = ${entity.pubTime},
    title = {${entity.title}},
    author = {${entity.authors.replace(/, /g, " and ")}},
    booktitle = {${this.replacePublication(entity.publication)}},${
          pubDetailStr ? "\n" + pubDetailStr : ""
        }
}`;
      } else if (entity.pubType == 3) {
        texbib = `@book{${citeKey},
    year = ${entity.pubTime},
    title = {${entity.title}},
    author = {${entity.authors.replace(/, /g, " and ")}},${
          pubDetailStr ? "\n" + pubDetailStr : ""
        }
}`;
      } else {
        texbib = `@article{${citeKey},
    year = ${entity.pubTime},
    title = {${entity.title}},
    author = {${entity.authors.replace(/, /g, " and ")}},
    journal = {${this.replacePublication(entity.publication)}},${
          pubDetailStr ? "\n" + pubDetailStr : ""
        }
}`;
      }
      allTexBib += texbib + "\n\n";
    }
    return allTexBib;
  }
}
