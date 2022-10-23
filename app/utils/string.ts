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
    if (removeStr) {
      formatted = formatted.replace(new RegExp(removeStr, "g"), "");
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
