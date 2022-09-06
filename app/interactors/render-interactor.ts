import katex from "katex";

import { Preference } from "@/preference/preference";

export class RenderInteractor {
  preference: Preference;

  constructor(preference: Preference) {
    this.preference = preference;
  }

  async renderMath(content: string) {
    try {
      return renderWithDelimitersToString(content);
    } catch (e) {
      console.error(e);
      return content;
    }
  }
}

function renderWithDelimitersToString(text: string) {
  var CleanAndRender = function (str: string) {
    return katex.renderToString(str.replace(/\\\(|\$|\\\)/g, ""));
  };
  return text.replace(
    /(\\\([^]*?\\\))|(\$[^]*?\$)/g,
    function (m, bracket, dollar) {
      if (bracket !== undefined) return CleanAndRender(m);
      if (dollar !== undefined)
        return (
          "<span style='width:100%;text-align:center;'>" +
          CleanAndRender(m) +
          "</span>"
        );
      return m;
    }
  );
}
