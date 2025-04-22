import { Categorizer } from "@/models/categorizer";
import { EntityType, IEntity } from "@/models/entity";

export interface formatStringParams {
  str: string | null;
  removeNewline?: boolean;
  removeWhite?: boolean;
  removeSymbol?: boolean;
  removeStr?: string | null;
  lowercased?: boolean;
  trimWhite?: boolean;
  whiteSymbol?: boolean;
}

export const formatString = ({
  str,
  removeNewline = false,
  removeWhite = false,
  removeSymbol = false,
  removeStr = null,
  lowercased = false,
  trimWhite = false,
  whiteSymbol = false,
}: formatStringParams): string => {
  if (!str) {
    return "";
  }
  let formatted = str;
  if (formatted) {
    if (removeStr) {
      formatted = formatted.replaceAll(removeStr, "");
    }
    if (removeNewline) {
      formatted = formatted.replace(/(\r\n|\n|\r)/gm, "");
    }
    if (trimWhite) {
      formatted = formatted.trim();
    }
    if (removeWhite) {
      formatted = formatted.replace(/\s/g, "");
    }
    if (removeSymbol) {
      formatted = formatted.replace(/[^\p{L}|\s]/gu, "");
    }

    if (lowercased) {
      formatted = formatted.toLowerCase();
    }
    if (whiteSymbol) {
      formatted = formatted.replace(/[^\p{L}]/gu, " ");
    }
    return formatted;
  } else {
    return "";
  }
};

export const getCategorizerString = (
  categorizer: Categorizer[],
  sortBy: string,
  sortOrder: string
) => {
  if (sortOrder === "asce") {
    if (sortBy === "name") {
      return categorizer
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => c.name)
        .join(" / ");
    } else if (sortBy === "count") {
      return categorizer
        .sort((a, b) => a.count - b.count)
        .map((c) => c.name)
        .join(" / ");
    } else if (sortBy === "color") {
      return categorizer
        .sort((a, b) => (a.color || "").localeCompare(b.color || ""))
        .map((c) => c.name)
        .join(" / ");
    } else {
      return categorizer.map((c) => c.name).join(" / ");
    }
  } else {
    if (sortBy === "name") {
      return categorizer
        .sort((a, b) => b.name.localeCompare(a.name))
        .map((c) => c.name)
        .join(" / ");
    } else if (sortBy === "count") {
      return categorizer
        .sort((a, b) => b.count - a.count)
        .map((c) => c.name)
        .join(" / ");
    } else if (sortBy === "color") {
      return categorizer
        .sort((a, b) => (b.color || "").localeCompare(a.color || ""))
        .map((c) => c.name)
        .join(" / ");
    } else {
      return categorizer.map((c) => c.name).join(" / ");
    }
  }
};

export const getPubTypeString = (pubType: EntityType) => {
  switch (pubType) {
    case "article":
      return "Article";
    case "book":
      return "Book";
    case "booklet":
      return "Booklet";
    case "inbook":
      return "InBook";
    case "incollection":
      return "InCollection";
    case "inproceedings":
      return "Conference";
    case "manual":
      return "Manual";
    case "mastersthesis":
      return "Master Thesis";
    case "misc":
      return "Misc";
    case "phdthesis":
      return "PhD Thesis";
    case "proceedings":
      return "Proceedings";
    case "techreport":
      return "Tech Report";
    default:
      return "Others";
  }
};

export const getShortAuthorString = (authors: string) => {
  const authorList = authors.split(",").map((a) => a.trim());
  if (authorList.length > 2) {
    return `${authorList[0]} et al.`;
  } else {
    return authors;
  }
};

export const getPublicationString = (entity: IEntity) => {
  const mapping = {
    article: "journal",
    book: "publisher",
    booklet: "howpublished",
    inbook: "booktitle",
    incollection: "booktitle",
    inproceedings: "booktitle",
    mastersthesis: "school",
    phdthesis: "school",
    techreport: "institution",
    misc: "howpublished",
  };
  if (mapping[entity.type]) {
    const publication = entity[mapping[entity.type]];
    if (publication) {
      return publication;
    } 
  } 
  return (
    entity["journal"] ||
    entity["booktitle"] ||
    entity["publisher"] ||
    entity["school"] ||
    entity["institution"] ||
    entity["howpublished"] ||
    ""
  );
};

export const getPublicationKey = (entity: IEntity) => {
  const mapping = {
    article: "journal",
    book: "publisher",
    booklet: "howpublished",
    inbook: "booktitle",
    incollection: "booktitle",
    inproceedings: "booktitle",
    mastersthesis: "school",
    phdthesis: "school",
    techreport: "institution",
    misc: "howpublished",
  };
  return mapping[entity.type];
}

export const compressString = async (
  str: string,
  encoding = "gzip" as CompressionFormat
): Promise<ArrayBuffer> => {
  const byteArray = new TextEncoder().encode(str);
  const cs = new CompressionStream(encoding);
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  return new Response(cs.readable).arrayBuffer();
};

export const decompressString = async (
  byteArray: string[],
  encoding = "gzip" as CompressionFormat
): Promise<string> => {
  const cs = new DecompressionStream(encoding);
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const arrayBuffer = await new Response(cs.readable).arrayBuffer();
  return new TextDecoder().decode(arrayBuffer);
};
