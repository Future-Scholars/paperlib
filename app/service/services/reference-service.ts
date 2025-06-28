import Cite from "citation-js";
import { XMLParser } from "fast-xml-parser";
import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";

import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";
import { formatString } from "@/base/string";
import { ILogService, LogService } from "@/common/services/log-service";
import { CSL } from "@/models/csl";
import { Entity } from "@/models/entity";

import { HookService, IHookService } from "./hook-service";
import { IPaperService, PaperService } from "./paper-service";

export const IReferenceService = createDecorator("referenceService");

export class ReferenceService {
  constructor(
    @IPaperService private readonly _paperService: PaperService,
    @IHookService private readonly _hookService: HookService,
    @ILogService private readonly _logService: LogService
  ) {
    this._setupCitePlugin();
  }

  private _setupCitePlugin() {
    const parseSingle = (paperEntityDraft: Entity) => {
      const output = {
        id: `${paperEntityDraft._id}`,
        type: paperEntityDraft.type,
        title: paperEntityDraft.title,
      };

      let nameArray: string[];
      if (paperEntityDraft.authors.includes(";")) {
        nameArray = paperEntityDraft.authors.split(";");
      } else {
        nameArray = paperEntityDraft.authors.split(",");
      }
      const nameObjects = nameArray.map((name) => {
        name = name.trim();
        const nameParts = name.split(" ");
        const given = nameParts.slice(0, nameParts.length - 1).join(" ");
        const family = nameParts[nameParts.length - 1];

        return {
          given: given,
          family: family,
        };
      });
      output["author"] = nameObjects;

      let citeKey = "";
      if (nameObjects.length >= 1) {
        citeKey += nameObjects[0].family.toLowerCase();
      }
      citeKey += paperEntityDraft.year;
      const titleArray = paperEntityDraft.title.split(" ");
      for (const word of titleArray) {
        if (
          word.toLocaleLowerCase() !== "the" &&
          word.toLocaleLowerCase() !== "a" &&
          word.toLocaleLowerCase() !== "an" &&
          word.length > 3
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
      output["citation-key"] = citeKey;

      for (const key of ["doi", "issn", "isbn"]) {
        if (paperEntityDraft[key]) {
          output[key.toUpperCase()] = paperEntityDraft[key];
        }
      }
      output["issued"] = {
        "date-parts": [[paperEntityDraft.year]],
      };

      for (const key of [
        "month",
        "volume",
        "number",
        "pages",
        "publisher",
        "series",
        "edition",
        "editor",
        "howpublished",
        "organization",
        "school",
        "institution",
        "address",
      ]) {
        if (paperEntityDraft[key]) {
          output[key] = paperEntityDraft[key];
        }
      }

      if (paperEntityDraft.journal) {
        output["container-title"] = paperEntityDraft.journal;
      } else if (paperEntityDraft.booktitle) {
        output["container-title"] = paperEntityDraft.booktitle;
      }

      return output;
    };

    const parseMulti = (paperEntityDrafts: Entity[]) => {
      return paperEntityDrafts.map((paperEntityDraft) => {
        return parseSingle(paperEntityDraft);
      });
    };

    const predicateSingle = (paperEntityDraft: Entity) => {
      return paperEntityDraft.addTime !== undefined;
    };

    const predicateMulti = (paperEntityDrafts: Entity[]) => {
      if (!!paperEntityDrafts?.[Symbol.iterator]) {
        return paperEntityDrafts.every((paperEntityDraft) => {
          return paperEntityDraft.addTime !== undefined;
        });
      } else {
        return false;
      }
    };

    Cite.plugins.input.add("@paperlib/Entity", {
      parse: parseSingle,
      parseType: {
        predicate: predicateSingle,
        dataType: "ComplexObject",
      },
    });
    Cite.plugins.input.add("@paperlib/Entity[]", {
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

  /**
   * Abbreviate the publication name according to the abbreviation list set in the preference interface.
   * @param source - The source paper entity.
   * @returns The paper entity with publication name abbreviated.
   */
  async replacePublication(source: Entity) {
    try {
      if (await PLMainAPI.preferenceService.get("enableExportReplacement")) {
        const pubReplacement = (await PLMainAPI.preferenceService.get(
          "exportReplacement"
        )) as [{ from: string; to: string }];

        const pubMap = new Map(
          pubReplacement.map((item) => [item.from, item.to])
        );

        const pubKey = source["journal"] ? "journal" : "booktitle";
        if (pubMap.has(source[pubKey]!)) {
          source[pubKey] = pubMap.get(source[pubKey]!) as string;
        }
      }
      return source;
    } catch (e) {
      this._logService.error(
        `Failed to abbreviate publication name.`,
        e as Error,
        true,
        "ReferenceService"
      );
      return source;
    }
  }

  /**
   * Convert paper entity to citationjs object.
   * @param source - The source paper entity.
   * @returns The cite object.
   */
  @errorcatching(
    "Failed to convert paper entity to cite object.",
    true,
    "ReferenceService",
    null
  )
  async toCite(source: Entity | Entity[] | string) {
    if (typeof source === "string") {
      return new Cite(source);
    } else if (source.constructor.name === "Entity") {
      return new Cite(await this.replacePublication(source as Entity));
    } else {
      return new Cite(
        await Promise.all(
          (source as Entity[]).map(
            async (item) => await this.replacePublication(item)
          )
        )
      );
    }
  }

  /**
   * Export BibItem.
   * @param paperEntities - The paper entities.
   * @returns The BibItem.
   */
  @errorcatching(
    "Failed to convert cite object to BibItem.",
    true,
    "ReferenceService",
    ""
  )
  async exportBibItem(paperEntities: Entity[]): Promise<string> {
    if (this._hookService.hasHook("beforeExportBibItem")) {
      [paperEntities] = await this._hookService.modifyHookPoint(
        "beforeExportBibItem",
        60000, // 1 min
        paperEntities
      );
    }

    let cite = await this.toCite(paperEntities);

    if (this._hookService.hasHook("citeObjCreatedInExportBibItem")) {
      [cite, paperEntities] = await this._hookService.modifyHookPoint(
        "citeObjCreatedInExportBibItem",
        60000, // 1 min
        cite,
        paperEntities
      );
    }

    // Code based on https://github.com/asouqi/bibtex-converter/blob/master/src/utilities/bib_converter.js
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    let bibitem = "";
    const bibTexKey = await this.exportBibTexKey(paperEntities);
    const bibTexKeyList = bibTexKey.split(",").map((x) => x.trim());

    const getAuthors = (authors) =>
      authors.map((author) => {
        const { family, given } = author;
        if (family && given) {
          return `${capitalize(family)}, ${given.charAt(0).toUpperCase()}.`;
        }
        return given ? capitalize(given) : (family && capitalize(family)) || "";
      });

    cite.data.forEach((bibtex, index) => {
      const { title, author, issued } = bibtex;

      bibitem += `\\bibitem{${bibTexKeyList[index]}}`;

      const authors = getAuthors(author);
      if (authors.length === 1) {
        bibitem += `${authors[0]} ${title}. `;
      } else {
        bibitem +=
          authors.slice(0, -1).join(", ") +
          " \\& " +
          authors.slice(-1)[0] +
          ` ${title}. `;
      }

      const journal = bibtex["container-title"];
      if (journal) {
        const { volume, page, issue } = bibtex;

        bibitem += `{\\em ${journal
          .split(" ")
          .map((_) => capitalize(_))
          .join(" ")}}.`;

        if (volume) {
          bibitem += ` \\textbf{${volume}}`;
        }
        if (page) {
          bibitem += issue ? `, ${page}` : ` pp. ${page}`;
        }
        if (issued && issued["date-parts"] && issued["date-parts"].length > 0) {
          bibitem += ` (${issued["date-parts"].toString()})`;
        }
      }

      const publisher = bibtex["publisher"];
      if (!journal && publisher) {
        bibitem +=
          (issued &&
            issued["date-parts"] &&
            `(${publisher},${issued["date-parts"].toString()})`) ||
          `(${publisher})`;
      }

      if (
        issued &&
        issued["date-parts"] &&
        issued["date-parts"].length > 0 &&
        !publisher &&
        !journal
      ) {
        bibitem += ` (${issued["date-parts"].toString()})`;
      }

      const url = bibtex["URL"];
      if (url && url !== publisher) {
        bibitem += `, ${url}`;
      }

      const note = bibtex["note"];
      if (note) {
        bibitem += `, ${note}`;
      }
      bibitem += "\n";
    });

    if (this._hookService.hasHook("afterExportBibItem")) {
      [bibitem] = await this._hookService.modifyHookPoint(
        "afterExportBibItem",
        60000, // 1 min
        bibitem
      );
    }
    return bibitem;
  }

  /**
   * Export BibTex key.
   * @param paperEntities - The paper entities.
   * @returns The BibTex key.
   */
  @errorcatching(
    "Failed to convert cite object to BibTex Key.",
    true,
    "ReferenceService",
    ""
  )
  async exportBibTexKey(paperEntities: Entity[]): Promise<string> {
    if (this._hookService.hasHook("beforeExportBibTexKey")) {
      [paperEntities] = await this._hookService.modifyHookPoint(
        "beforeExportBibTexKey",
        60000, // 1 min
        paperEntities
      );
    }

    let cite = await this.toCite(paperEntities);

    if (this._hookService.hasHook("citeObjCreatedInExportBibTexKey")) {
      [cite, paperEntities] = await this._hookService.modifyHookPoint(
        "citeObjCreatedInExportBibTexKey",
        60000, // 1 min
        cite,
        paperEntities
      );
    }

    let bibKeyStr = cite.format("bibtex-key");

    if (this._hookService.hasHook("afterExportBibTexKey")) {
      [bibKeyStr] = await this._hookService.modifyHookPoint(
        "afterExportBibTexKey",
        60000, // 1 min
        bibKeyStr
      );
    }

    return bibKeyStr;
  }

  /**
   * Export BibTex body string.
   * @param paperEntities - The paper entities.
   * @returns The BibTex body string.
   */
  @errorcatching(
    "Failed to convert cite object to BibTex string.",
    true,
    "ReferenceService",
    ""
  )
  async exportBibTexBody(paperEntities: Entity[]): Promise<string> {
    if (this._hookService.hasHook("beforeExportBibTexBody")) {
      [paperEntities] = await this._hookService.modifyHookPoint(
        "beforeExportBibTexBody",
        60000, // 1 min
        paperEntities
      );
    }

    let cite = await this.toCite(paperEntities);

    if (this._hookService.hasHook("citeObjCreatedInExportBibTexBody")) {
      [cite, paperEntities] = await this._hookService.modifyHookPoint(
        "citeObjCreatedInExportBibTexBody",
        60000, // 1 min
        cite,
        paperEntities
      );
    }

    const mathEnvStrs: string[] = [];
    let idx = 0;
    for (const i in cite.data) {
      let title: string = cite.data[i].title;
      const envRegex = /\$(.*?)\$/g;
      const envs = title.match(envRegex);
      if (envs) {
        for (const env of envs) {
          mathEnvStrs.push(env);
          title = title.replace(env, `MATHENVDOLLAR{i}`);
          idx += 1;
        }
        cite.data[i].title = title;
      }
    }

    let bibtexBody = escapeLaTexString(cite.format("bibtex"));

    for (const i in mathEnvStrs) {
      bibtexBody = bibtexBody
        .replace(`MATHENVDOLLAR{i}`, mathEnvStrs[i])
        .replace(`{MATHENVDOLLAR}{i}`, mathEnvStrs[i]);
    }

    if (this._hookService.hasHook("afterExportBibTexBody")) {
      [bibtexBody] = await this._hookService.modifyHookPoint(
        "afterExportBibTexBody",
        60000, // 1 min
        bibtexBody
      );
    }

    return bibtexBody;
  }

  /**
   * Export BibTex body string in folder.
   * @param folderName - The folder name.
   */
  @errorcatching(
    "Failed to export BibTex body in folder.",
    true,
    "ReferenceService",
    ""
  )
  async exportBibTexBodyInFolder(folderName: string) {
    const paperEntities = (await this._paperService.load(
      `folders.name == '${folderName}'`,
      "title",
      "asce"
    )) as Entity[];
    return this.exportBibTexBody(paperEntities);
  }

  /**
   * Export plain text.
   * @param paperEntities - The paper entities.
   * @returns The plain text.
   */
  @errorcatching(
    "Failed to convert cite object to plain text.",
    true,
    "ReferenceService",
    ""
  )
  async exportPlainText(paperEntities: Entity[]): Promise<string> {
    if (this._hookService.hasHook("beforeExportPlainText")) {
      [paperEntities] = await this._hookService.modifyHookPoint(
        "beforeExportPlainText",
        60000, // 1 min
        paperEntities
      );
    }

    let cite = await this.toCite(paperEntities);

    if (this._hookService.hasHook("citeObjCreatedInExportPlainText")) {
      [cite, paperEntities] = await this._hookService.modifyHookPoint(
        "citeObjCreatedInExportPlainText",
        60000, // 1 min
        cite,
        paperEntities
      );
    }

    const csl = (await PLMainAPI.preferenceService.get(
      "selectedCSLStyle"
    )) as string;

    let outStr = "";
    if (["apa", "vancouver", "harvard1"].includes(csl)) {
      outStr = cite.format("bibliography", { template: csl });
    } else {
      let templatePath = path.join(
        (await PLMainAPI.preferenceService.get(
          "importedCSLStylesPath"
        )) as string,
        csl + ".csl"
      );

      let config = Cite.plugins.config.get("@csl");
      if (existsSync(templatePath)) {
        if (!config.templates.has(csl)) {
          const template = readFileSync(templatePath, "utf8");
          config.templates.add(csl, template);
        }

        outStr = cite.format("bibliography", { template: csl });
      } else {
        this._logService.error(
          `CSL template file: ${csl}.csl not found.`,
          "",
          true,
          "Reference"
        );

        outStr = cite.format("bibliography", { template: "apa" });
      }
    }

    if (this._hookService.hasHook("afterExportPlainText")) {
      [outStr] = await this._hookService.modifyHookPoint(
        "afterExportPlainText",
        60000, // 1 min
        outStr
      );
    }

    return outStr;
  }

  /**
   * Export plain text in folder.
   * @param folderName - The folder name.
   */
  @errorcatching(
    "Failed to export plain text in folder.",
    true,
    "ReferenceService",
    ""
  )
  async exportPlainTextInFolder(folderName: string) {
    const paperEntities = (await this._paperService.load(
      `folders.name == '${folderName}'`,
      "title",
      "asce"
    )) as Entity[];
    return this.exportPlainText(paperEntities);
  }

  /**
   * Export papers as csv string.
   * @param paperEntities - The paper entities.
   * @returns The CSV string.
   */
  @errorcatching(
    "Failed to convert papers to CSV string.",
    true,
    "ReferenceService",
    ""
  )
  exportCSV(paperEntities: Entity[]): string {
    let csv: string = "";

    // Headers
    const isExportProperty = (key: string): boolean => {
      if (key.startsWith("_")) {
        return false;
      }
      return true;
    };
    const headers: string[] = [];
    for (const key in Entity.schema.properties) {
      if (isExportProperty(key)) {
        csv += key + ",";
        headers.push(key);
      }
    }
    csv += "\n";

    // Data
    for (const paper of paperEntities) {
      for (const key of headers) {
        let content = "";
        if (key === "tags" || key === "folders") {
          content = paper[key].map((item) => item.name).join(";");
        } else if (key === "supplementaries") {
          content = JSON.stringify(paper[key]);
        } else {
          content = paper[key];
        }
        csv += '"' + content + '",';
      }
      csv += "\n";
    }

    return csv;
  }

  /**
   * Export paper entities.
   * @param paperEntities - The paper entities.
   * @param format - The export format: "BibTex" | "BibTex-Key" | "PlainText"
   */
  @errorcatching("Failed to export paper entities.", true, "ReferenceService")
  async export(paperEntities: Entity[], format: string) {
    let paperEntityDrafts = paperEntities.map((paperEntity) => {
      return new Entity(paperEntity);
    });

    let copyStr = "";
    let folderName = "";
    switch (format) {
      case "BibTex":
        copyStr = await this.exportBibTexBody(paperEntityDrafts);
        break;
      case "BibItem":
        copyStr = await this.exportBibItem(paperEntityDrafts);
        break;
      case "BibTex-Key":
        copyStr = await this.exportBibTexKey(paperEntityDrafts);
        break;
      case "PlainText":
        copyStr = await this.exportPlainText(paperEntityDrafts);
        break;
      case "CSV":
        copyStr = this.exportCSV(paperEntityDrafts);
        break;
      case "BibTex-In-Folder":
        folderName = (await PLMainAPI.preferenceService.get(
          "pluginLinkedFolder"
        )) as string;
        if (!folderName) {
          return;
        }
        copyStr = await this.exportBibTexBodyInFolder(folderName as string);
        break;
      case "PlainText-In-Folder":
        folderName = (await PLMainAPI.preferenceService.get(
          "pluginLinkedFolder"
        )) as string;
        if (!folderName) {
          return;
        }
        copyStr = await this.exportPlainTextInFolder(folderName);
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
        break;
    }

    PLMainAPI.systemService.writeClipboard(copyStr);
    this._logService.info(
      "Copied to clipboard.",
      copyStr,
      true,
      "ReferenceService"
    );
  }

  /**
   * Load CSL styles.
   * @returns The CSL styles.
   */
  @errorcatching("Failed to load CSL styles.", true, "ReferenceService", [])
  async loadCSLStyles(): Promise<{ key: string; name: string }[]> {
    const CSLStyles = [
      {
        key: "apa",
        name: "American Psychological Association",
      },
      {
        key: "vancouver",
        name: "Vancouver",
      },
      {
        key: "harvard1",
        name: "Harvard1",
      },
    ];

    const importedCSLStylesPath = (await PLMainAPI.preferenceService.get(
      "importedCSLStylesPath"
    )) as string;

    if (importedCSLStylesPath) {
      // List all files in the importedCSLStylesPath
      const files = readdirSync(importedCSLStylesPath);
      const xmlParser = new XMLParser();

      const parsePromise = async (filePath: string) => {
        const fileContent = readFileSync(filePath);
        const xml = xmlParser.parse(fileContent);
        try {
          const name = xml.style.info.title;
          const key = path.basename(filePath, ".csl");
          return { key, name };
        } catch (e) {
          return null;
        }
      };

      const promises: Promise<{
        key: string;
        name: any;
      } | null>[] = [];

      for (const file of files) {
        if (file.endsWith(".csl")) {
          promises.push(parsePromise(path.join(importedCSLStylesPath, file)));
        }
      }

      const importedCSLStyles = (await Promise.all(promises)).filter(
        (item) => item !== null
      ) as { key: string; name: string }[];

      return [...CSLStyles, ...importedCSLStyles];
    }

    return CSLStyles;
  }
}

function escapeLaTexString(str: string) {
  const out = str
    .replaceAll("&", "\\&")
    .replaceAll("%", "\\%")
    .replaceAll("#", "\\#");
  return out;
}
