import { PLAPI, PLExtAPI } from "paperlib";
import stringSimilarity from "string-similarity";

import { PLExtension } from "./base/extension";

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

class SimpleUIExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "paperlib-demo-ui-extension",
      name: "SimpleUI",
      description: "This is a simple demo UI extension in Paperlib.",
      author: "Paperlib",
      defaultPreference: {
        description: {
          type: "string",
          name: "Description",
          description: "description.",
          value: "",
        },
      },
    });

    this.disposeCallbacks = [];
  }

  async initialize() {
    await PLExtAPI.extensionPreferenceService.register(
      this.id,
      this.defaultPreference
    );

    this.disposeCallbacks.push(
      PLAPI.uiStateService.onChanged("selectedPaperEntities", (newValues) => {
        this.getCitationCount(newValues[0].value);
      })
    );
  }

  async dispose() {
    for (const disposeCallback of this.disposeCallbacks) {
      disposeCallback();
    }

    PLExtAPI.extensionPreferenceService.unregister(this.id);
  }

  async getCitationCount(selectedPaperEntities: any[]) {
    if (selectedPaperEntities.length === 0) {
      return;
    }

    PLAPI.uiStateService.setState({
      paperDetailsPanelSlot1: {
        id: "citationCount",
        title: "Citation Count",
        content: `N/A (N/A)`,
      },
    });

    const paperEntity = selectedPaperEntities[0];

    let scrapeURL;
    if (paperEntity.doi !== "") {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/${paperEntity.doi}?fields=title,citationCount,influentialCitationCount`;
    } else if (paperEntity.arxiv !== "") {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${
        paperEntity.arxiv.toLowerCase().replace("arxiv:", "").split("v")[0]
      }?fields=title,citationCount,influentialCitationCount`;
    } else {
      scrapeURL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formatString(
        {
          str: paperEntity.title,
          whiteSymbol: true,
        }
      )}&limit=10&fields=title,citationCount,influentialCitationCount`;
    }

    const response = await PLAPI.networkTool.get(
      scrapeURL,
      {},
      1,
      false,
      5000,
      true
    );

    const parsedResponse = JSON.parse(response.body);

    const citationCount = {
      semanticscholarId: "",
      citationCount: "N/A",
      influentialCitationCount: "N/A",
    };

    let itemList;
    // @ts-ignore
    if (parsedResponse.data) {
      // @ts-ignore
      itemList = parsedResponse.data;
    } else {
      itemList = [parsedResponse];
    }

    for (const item of itemList) {
      const plainHitTitle = formatString({
        str: item.title,
        removeStr: "&amp;",
        removeSymbol: true,
        lowercased: true,
      });

      const existTitle = formatString({
        str: paperEntity.title,
        removeStr: "&amp;",
        removeSymbol: true,
        lowercased: true,
      });

      const sim = stringSimilarity.compareTwoStrings(plainHitTitle, existTitle);
      if (sim > 0.95) {
        citationCount.citationCount = `${item.citationCount}`;
        citationCount.influentialCitationCount = `${item.influentialCitationCount}`;

        break;
      }
    }

    PLAPI.uiStateService.setState({
      paperDetailsPanelSlot1: {
        id: "citationCount",
        title: "Citation Count",
        content: `${citationCount.citationCount} (${citationCount.influentialCitationCount})`,
      },
    });
  }
}

async function initialize() {
  const extension = new SimpleUIExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
