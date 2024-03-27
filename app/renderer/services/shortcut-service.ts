import { getCurrentScope, onScopeDispose } from "vue";

import { createDecorator } from "@/base/injection/injection";

export const IShortcitService = createDecorator("shortcutService");

enum ShortcutViewLevel {
  LEVEL1 = 1,
  LEVEL2 = 2,
  LEVEL3 = 3,
}

export class ShortcutService {
  readonly viewLevel = ShortcutViewLevel;

  private curViewLevel = ShortcutViewLevel.LEVEL1;

  private readonly _registeredShortcuts: {
    [code: string]: {
      [id: string]: {
        handler: (...args: any[]) => void;
        preventDefault: boolean;
        stopPropagation: boolean;
        viewLevel: ShortcutViewLevel;
      };
    };
  } = {};

  constructor() {
    window.addEventListener("keydown", (e) => {
      let shortcut = "";

      if (e.ctrlKey || e.metaKey) {
        shortcut += "ctrlmeta+";
      } else if (e.ctrlKey) {
        shortcut += "ctrl+";
      }
      if (e.altKey) {
        shortcut += "alt+";
      }
      if (e.shiftKey) {
        shortcut += "shift+";
      }
      shortcut += e.code;

      if (this._registeredShortcuts[shortcut]) {
        const handlerId = (
          Object.keys(this._registeredShortcuts[shortcut]).length - 1
        ).toString();
        const eventAction = this._registeredShortcuts[shortcut][handlerId];
        if (!eventAction || eventAction.viewLevel !== this.curViewLevel) {
          return;
        }
        if (eventAction.preventDefault) {
          e.preventDefault();
        }
        eventAction.handler(e);
        if (eventAction.stopPropagation) {
          e.stopPropagation();
        }
      }
    });
  }

  /**
   * Register a shortcut.
   * @param code - Shortcut code.
   * @param handler - Shortcut handler.
   * @param preventDefault - Whether to prevent default behavior.
   * @param stopPropagation - Whether to stop propagation.
   * @param viewLevel - Whether to stop propagation.
   * @returns Unregister function. */
  register(
    code: string,
    handler: (...args: any[]) => void,
    preventDefault: boolean = true,
    stopPropagation: boolean = true
  ) {
    console.log("register shortcut, ", code, this.curViewLevel);
    if (!this._registeredShortcuts[code]) {
      this._registeredShortcuts[code] = {};
    }

    const id = Object.keys(this._registeredShortcuts[code]).length.toString();
    this._registeredShortcuts[code][id] = {
      handler,
      preventDefault,
      stopPropagation,
      viewLevel: this.curViewLevel,
    };

    // Auto dispose when vue component is destroyed
    if (getCurrentScope()) {
      onScopeDispose(() => {
        delete this._registeredShortcuts[code][id];
      });
    }

    return () => {
      delete this._registeredShortcuts[code][id];
    };
  }

  /**
   * Register a shortcut that is still working in input field.
   * @returns Unregister function. */
  registerInInputField = this.register;

  updateViewLevel(level: ShortcutViewLevel) {
    let oldLevel = this.curViewLevel;

    this.curViewLevel = level;
    console.log("set level", this.curViewLevel);

    return () => {
      this.curViewLevel = oldLevel;
      console.log("restore level", oldLevel);
    };
  }
}
