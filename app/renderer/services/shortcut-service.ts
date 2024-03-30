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

  private _workingViewScope = ShortcutViewScope.MAIN;

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
      if (this._registeredShortcuts[shortcut]) {
        const eventActionLength = Object.keys(
          this._registeredShortcuts[shortcut]
        ).length;
        let targetViewScope = this._workingViewScope;
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          targetViewScope = this.viewScope.INPUT;
        }

        //Traverse all elements but execute a callback function at most
        for (let i = eventActionLength - 1; i >= 0; i--) {
          const handlerId = i.toString();

          const eventAction = this._registeredShortcuts[shortcut][handlerId];
          if (!eventAction) {
            continue;
          }
          if (eventAction.viewScope !== this.viewScope.GLOBAL && eventAction.viewScope !== targetViewScope) {
            continue;
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
      | ShortcutViewScope
      | null = null
  ) {
    if (code.trim().length === 0) {
      return () => { };
    }
    const formattedCode = formatKeycode(code);

    if (!this._registeredShortcuts[formattedCode]) {
      this._registeredShortcuts[formattedCode] = {};
    } else {
      for (let id in this._registeredShortcuts[formattedCode]) {
        if (
          this._registeredShortcuts[formattedCode][id].viewScope ===
          (viewScope || this._workingViewScope)
        ) {
          console.warn(
            `Shortcut ${formattedCode} is already registered in the same view scope.`
          );
        }
      }
    }

    const id = Object.keys(
      this._registeredShortcuts[formattedCode]
    ).length.toString();
    this._registeredShortcuts[formattedCode][id] = {
      handler,
      preventDefault,
      stopPropagation,
      viewScope: viewScope || this._workingViewScope,
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
    let oldScope = this._workingViewScope;

    this._workingViewScope = scope;

    return () => {
      this._workingViewScope = oldScope;
    };
  }
}
