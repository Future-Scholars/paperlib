import Cite from "citation-js";
import { clipboard } from "electron";
import { XMLParser } from "fast-xml-parser";
import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";

import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";
import { formatString } from "@/base/string";
import { ILogService, LogService } from "@/common/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { CSL } from "@/models/csl";
import { PaperEntity } from "@/models/paper-entity";
import { IPaperService, PaperService } from "@/renderer/services/paper-service";

export const IReferenceService = createDecorator("referenceService");

export class ReferenceService {
  constructor(
    @IPaperService private readonly _paperService: PaperService,
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @ILogService private readonly _logService: LogService
  ) {
    this._setupCitePlugin();
  }

  private _setupCitePlugin() {
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

  /**
   * Abbreviate the publication name according to the abbreviation list set in the preference interface.
   * @param source - The source paper entity.
   * @returns The paper entity with publication name abbreviated.
   */
  replacePublication(source: PaperEntity) {
    try {
      if (this._preferenceService.get("enableExportReplacement")) {
        const pubReplacement = this._preferenceService.get(
          "exportReplacement"
        ) as [{ from: string; to: string }];

        const pubMap = new Map(
          pubReplacement.map((item) => [item.from, item.to])
        );

        if (pubMap.has(source.publication)) {
          source.publication = pubMap.get(source.publication) as string;
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

  /**
   * Export BibTex key.
   * @param cite - The cite object.
   * @returns The BibTex key.
   */
  @errorcatching(
    "Failed to convert cite object to BibTex Key.",
    true,
    "ReferenceService",
    ""
  )
  exportBibTexKey(cite: Cite): string {
    return cite.format("bibtex-key");
  }

  /**
   * Export BibTex body string.
   * @param cite - The cite object.
   * @returns The BibTex body string.
   */
  @errorcatching(
    "Failed to convert cite object to BibTex string.",
    true,
    "ReferenceService",
    ""
  )
  exportBibTexBody(cite: Cite): string {
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
    const paperEntities = await this._paperService.load(
      `folders.name == '${folderName}'`,
      "title",
      "asce"
    );
    return this.exportBibTexBody(this.toCite(paperEntities as PaperEntity[]));
  }

  /**
   * Export plain text.
   * @param cite - The cite object.
   * @returns The plain text.
   */
  @errorcatching(
    "Failed to convert cite object to plain text.",
    true,
    "ReferenceService",
    ""
  )
  async exportPlainText(cite: Cite): Promise<string> {
    const csl = this._preferenceService.get("selectedCSLStyle") as string;

    if (["apa", "vancouver", "harvard1"].includes(csl)) {
      return cite.format("bibliography", { template: csl });
    } else {
      let templatePath = path.join(
        this._preferenceService.get("importedCSLStylesPath") as string,
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
        this._logService.error(
          `CSL template file: ${csl}.csl not found.`,
          "",
          true,
          "Reference"
        );

        return cite.format("bibliography", { template: "apa" });
      }
    }
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
    const paperEntities = await this._paperService.load(
      `folders.name == '${folderName}'`,
      "title",
      "asce"
    );
    return this.exportPlainText(this.toCite(paperEntities as PaperEntity[]));
  }

  /**
   * Export papers as csv string.
   * @param papers - The PaperEntity array.
   * @returns The CSV string.
   */
  @errorcatching(
    "Failed to convert papers to CSV string.",
    true,
    "ReferenceService",
    ""
  )
  exportCSV(paperEntities: PaperEntity[]): string {
    let csv: string = "";

    // Headers
    const isExportProperty = (key: string): boolean => {
      if (key.startsWith("_")) {
        return false;
      }
      return true;
    };
    const headers: string[] = [];
    for (const key in PaperEntity.schema.properties) {
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
        } else if (key === "sups") {
          content = paper[key].join(";");
        } else if (key === "codes") {
          content = paper[key].join(";");
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
  async export(paperEntities: PaperEntity[], format: string) {
    let paperEntityDrafts = paperEntities.map((paperEntity) => {
      return new PaperEntity(paperEntity);
    });

    let copyStr = "";
    let folderName = "";
    switch (format) {
      case "BibTex":
        copyStr = this.exportBibTexBody(this.toCite(paperEntityDrafts));
        break;
      case "BibTex-Key":
        copyStr = this.exportBibTexKey(this.toCite(paperEntityDrafts));
        break;
      case "PlainText":
        copyStr = await this.exportPlainText(this.toCite(paperEntityDrafts));
        break;
      case "CSV":
        copyStr = await this.exportCSV(paperEntityDrafts);
        break;
      case "BibTex-In-Folder":
        folderName = this._preferenceService.get(
          "pluginLinkedFolder"
        ) as string;
        if (!folderName) {
          return;
        }
        copyStr = await this.exportBibTexBodyInFolder(folderName as string);
        break;
      case "PlainText-In-Folder":
        folderName = this._preferenceService.get(
          "pluginLinkedFolder"
        ) as string;
        if (!folderName) {
          return;
        }
        copyStr = await this.exportPlainTextInFolder(folderName);
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
        break;
    }

    clipboard.writeText(copyStr);
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

    const importedCSLStylesPath = this._preferenceService.get(
      "importedCSLStylesPath"
    ) as string;

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
