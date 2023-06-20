import { Categorizer } from "@/models/categorizer";

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
    }
  }
};

export const getPubTypeString = (pubType: number) => {
  switch (pubType) {
    case 0:
      return "Article";
    case 1:
      return "Conference";
    case 2:
      return "Others";
    case 3:
      return "Book";
    default:
      return "Others";
  }
};
