import { getCurrentScope, onScopeDispose } from "vue";

import { createDecorator } from "@/base/injection/injection";
import { formatShortcut } from "@/common/utils.ts";

export const IShortcitService = createDecorator("shortcutService");

enum ShortcutViewScope {
  MAIN = "main",
  OVERLAY = "overlay",
  INPUT = "input",
  GLOBAL = "global",
}

export class ShortcutService {
  readonly viewScope = ShortcutViewScope;

  private workingViewScope = ShortcutViewScope.MAIN;

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
        let targetViewScope = this.workingViewScope;
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          targetViewScope = this.viewScope.INPUT;
        }
        const eventAction = this._registeredShortcuts[shortcut][handlerId];
        if (!eventAction) {
          return;
        }
        if (eventAction.viewScope !== this.viewScope.GLOBAL) {
          if (eventAction.viewScope !== targetViewScope) {
            return;
          }
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
   * @param viewScope - The scope of shortcuts to be registered.
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
    console.log(
      "register shortcut, ",
      code,
      viewScope || this.workingViewScope
    );
    if (!this._registeredShortcuts[code]) {
      this._registeredShortcuts[code] = {};
    }

    const id = Object.keys(this._registeredShortcuts[code]).length.toString();
    this._registeredShortcuts[code][id] = {
      handler,
      preventDefault,
      stopPropagation,
      viewScope: viewScope || this.workingViewScope,
    };

    // Auto dispose when vue component is destroyed
    if (getCurrentScope()) {
      onScopeDispose(() => {
        if (this._registeredShortcuts[code]) {
          delete this._registeredShortcuts[code][id];
        }
      });
    }

    return () => {
      if (this._registeredShortcuts[code]) {
        delete this._registeredShortcuts[code][id];
      }
    };
  }

  /**
   * Update working view scope.
   * @param scope - The scope to be updated.
   * @returns Restore function. */
  updateWorkingViewScope(scope: ShortcutViewScope) {
    let oldScope = this.workingViewScope;

    this.workingViewScope = scope;
    console.log("set shortcut-service scope", this.workingViewScope);

    return () => {
      this.workingViewScope = oldScope;
      console.log("restore shortcut-service scope", oldScope);
    };
  }
}
