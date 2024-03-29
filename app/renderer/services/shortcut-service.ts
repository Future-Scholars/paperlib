import { getCurrentScope, onScopeDispose } from "vue";

import { createDecorator } from "@/base/injection/injection";
import { formatShortcut } from "@/common/utils.ts";

export const IShortcitService = createDecorator("shortcutService");

enum ShortcutViewScope {
  MAIN = "main",
  OVERLAY = "overlay",
  INPUT = "input",
}

export class ShortcutService {
  readonly viewLevel = ShortcutViewScope;

  private curViewScope = ShortcutViewScope.MAIN;

  private readonly _registeredShortcuts: {
    [code: string]: {
      [id: string]: {
        handler: (...args: any[]) => void;
        preventDefault: boolean;
        stopPropagation: boolean;
        viewScope: ShortcutViewScope;
      };
    };
  } = {};

  constructor() {
    window.addEventListener("keydown", (e) => {
      let shortcut = formatShortcut(e).join("+");
      console.log(shortcut);
      if (this._registeredShortcuts[shortcut]) {
        const handlerId = (
          Object.keys(this._registeredShortcuts[shortcut]).length - 1
        ).toString();
        let targetViewScope = this.curViewScope;
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          targetViewScope = this.viewLevel.INPUT;
        }
        const eventAction = this._registeredShortcuts[shortcut][handlerId];
        if (!eventAction || eventAction.viewScope !== targetViewScope) {
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
   * @param viewScope - Whether to stop propagation.
   * @returns Unregister function. */
  register(
    code: string,
    handler: (...args: any[]) => void,
    preventDefault: boolean = true,
    stopPropagation: boolean = true,
    viewScope: ShortcutViewScope | null = null
  ) {
    if (code.trim().length === 0) {
      return () => {};
    }
    console.log("register shortcut, ", code, this.curViewScope);
    if (!this._registeredShortcuts[code]) {
      this._registeredShortcuts[code] = {};
    }

    const id = Object.keys(this._registeredShortcuts[code]).length.toString();
    this._registeredShortcuts[code][id] = {
      handler,
      preventDefault,
      stopPropagation,
      viewScope: viewScope || this.curViewScope,
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

  updateViewLevel(level: ShortcutViewScope) {
    let oldLevel = this.curViewScope;

    this.curViewScope = level;
    console.log("set level", this.curViewScope);

    return () => {
      this.curViewScope = oldLevel;
      console.log("restore level", oldLevel);
    };
  }
}
