import { PaperEntityDraft } from "../models/PaperEntity";

export const formatString = ({
  str: str,
  returnEmpty: returnEmpty = true,
  removeNewline: removeNewline = false,
  removeWhite: removeWhite = false,
  removeSymbol: removeSymbol = false,
  removeStr: removeStr = null,
  lowercased: lowercased = false,
  trimWhite: trimWhite = false,
}) => {
  var formatted = str;
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
      formatted = formatted.replace(/[^a-zA-Z0-9]/g, "");
    }
    if (removeStr) {
      formatted = formatted.replace(removeStr, "");
    }
    if (lowercased) {
      formatted = formatted.toLowerCase();
    }
    return formatted;
  } else {
    return "";
  }
};

export function unpackEntity(entity) {
  let unpackedEntity = new PaperEntityDraft(entity);
  return unpackedEntity;
}
