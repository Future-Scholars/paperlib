import { getCurrentScope, onScopeDispose } from "vue";

import { createDecorator } from "@/base/injection/injection";
import { formatKeycode, formatShortcut } from "@/common/utils.ts";

export const IShortcitService = createDecorator("shortcutService");

enum ShortcutViewScope {
  MAIN = "main",
  OVERLAY = "overlay",
  INPUT = "input",
  //Don't use it unless you know what you are doing
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
        const eventActionLength = Object.keys(
          this._registeredShortcuts[shortcut]
        ).length;
        let targetViewScope = this.workingViewScope;
        //Traverse all elements but execute a callback function at most
        for (let i = eventActionLength - 1; i >= 0; i--) {
          const handlerId = i.toString();
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          ) {
            targetViewScope = this.viewScope.INPUT;
          }
          const eventAction = this._registeredShortcuts[shortcut][handlerId];
          if (!eventAction) {
            continue;
          }
          if (eventAction.viewScope !== this.viewScope.GLOBAL) {
            if (eventAction.viewScope !== targetViewScope) {
              continue;
            }
          }
          if (eventAction.preventDefault) {
            e.preventDefault();
          }
          eventAction.handler(e);
          if (eventAction.stopPropagation) {
            e.stopPropagation();
          }
          break;
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
    viewScope:
      | ShortcutViewScope.MAIN
      | ShortcutViewScope.GLOBAL
      | ShortcutViewScope.OVERLAY
      | null = null
  ) {
    if (code.trim().length === 0) {
      return () => {};
    }
    const formattedCode = formatKeycode(code);
    console.log(
      "register shortcut, ",
      formattedCode,
      viewScope || this.workingViewScope
    );
    if (!this._registeredShortcuts[formattedCode]) {
      this._registeredShortcuts[formattedCode] = {};
    }

    const id = Object.keys(
      this._registeredShortcuts[formattedCode]
    ).length.toString();
    this._registeredShortcuts[formattedCode][id] = {
      handler,
      preventDefault,
      stopPropagation,
      viewScope: viewScope || this.workingViewScope,
    };

    // Auto dispose when vue component is destroyed
    if (getCurrentScope()) {
      onScopeDispose(() => {
        if (this._registeredShortcuts[formattedCode]) {
          delete this._registeredShortcuts[formattedCode][id];
        }
      });
    }

    return () => {
      if (this._registeredShortcuts[formattedCode]) {
        delete this._registeredShortcuts[formattedCode][id];
      }
    };
  }

  /**
   * Update working view scope.
   * @param scope - The scope to be updated.
   * @returns Restore function. */
  updateWorkingViewScope(
    scope: ShortcutViewScope.OVERLAY | ShortcutViewScope.MAIN
  ) {
    let oldScope = this.workingViewScope;

    this.workingViewScope = scope;
    console.log("set shortcut-service scope", this.workingViewScope);

    return () => {
      this.workingViewScope = oldScope;
      console.log("restore shortcut-service scope", oldScope);
    };
  }
}
