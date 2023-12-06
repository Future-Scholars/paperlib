import { PLAPI, PLExtAPI } from "paperlib";

import { PLExtension } from "./base/extension";

class SimpleHookExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "paperlib-demo-hook-extension",
      name: "SimpleHook",
      description: "This is a simple demo hook extension in Paperlib.",
      author: "Paperlib",
      defaultPreference: {
        keywords: {
          type: "string",
          name: "Message",
          description: "Keywords for tags.",
          value: "{}",
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

    PLAPI.hookService.hook("afterScrapePMS", this.id, "attachTags");
  }

  async dispose() {
    for (const disposeCallback of this.disposeCallbacks) {
      disposeCallback();
    }

    PLExtAPI.extensionPreferenceService.unregister(this.id);
  }

  async attachTags(paperEntityDrafts: any[]) {
    let keywordsStr = (
      await PLExtAPI.extensionPreferenceService.get(this.id, "keywords")
    ).replace(/'/g, '"');

    const keywords = JSON.parse(keywordsStr) as Record<string, string>;

    for (const paperEntityDraft of paperEntityDrafts) {
      const title = paperEntityDraft.title.toLowerCase();

      let autoTags: { name: string; color?: string }[] = [];
      for (const [key, tag] of Object.entries(keywords)) {
        if (title.includes(key.toLowerCase())) {
          autoTags.push({
            name: tag,
          });
        }
      }

      paperEntityDraft.tags = [...paperEntityDraft.tags, ...autoTags];
    }

    console.log(paperEntityDrafts);

    return [paperEntityDrafts];
  }
}

async function initialize() {
  const extension = new SimpleHookExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
