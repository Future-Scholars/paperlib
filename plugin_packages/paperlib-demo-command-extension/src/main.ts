import { PLAPI, PLExtAPI } from "paperlib";

import { PLExtension } from "./base/extension";

class SimpleExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  constructor() {
    super({
      id: "paperlib-demo-command-extension",
      name: "SimpleCMD",
      description: "This is a simple demo command extension in Paperlib.",
      author: "Paperlib",
      defaultPreference: {
        msg: {
          type: "string",
          name: "Message",
          description: "Message to show when echo",
          value: "Hello from the extension process",
        },
        signature: {
          type: "boolean",
          name: "Signature",
          description: "Show signature in the message",
          value: false,
        },
        lang: {
          type: "options",
          name: "Language",
          description: "Language of the message",
          options: { en: "English", zh: "Chinese" },
          value: "en",
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
      PLExtAPI.extensionPreferenceService.onChanged(
        this.id,
        "msg",
        (newValues) => {
          console.log("msg changed", newValues);
        }
      )
    );

    this.disposeCallbacks.push(
      PLAPI.commandService.on("command_echo", () => {
        this.echo();
      })
    );

    PLAPI.commandService.registerExternel({
      id: "command_echo",
      description: "Hello from the extension process",
      event: "command_echo",
    });
  }

  async dispose() {
    for (const disposeCallback of this.disposeCallbacks) {
      disposeCallback();
    }

    PLExtAPI.extensionPreferenceService.unregister(this.id);
  }

  echo() {
    let msg = PLExtAPI.extensionPreferenceService.get(this.id, "msg");

    console.log(PLExtAPI.extensionPreferenceService.get(this.id, "signature"));
    if (PLExtAPI.extensionPreferenceService.get(this.id, "signature")) {
      if (PLExtAPI.extensionPreferenceService.get(this.id, "lang") === "zh") {
        msg += " - 来自 SimpleCMD 扩展";
      } else {
        msg += " - from SimpleCMD Extension";
      }
    }
    console.log(msg);
  }
}

async function initialize() {
  const extension = new SimpleExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
