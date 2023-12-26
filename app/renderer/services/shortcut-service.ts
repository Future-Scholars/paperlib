import { getCurrentScope, onScopeDispose } from "vue";

import { createDecorator } from "@/base/injection/injection";

export const IShortcitService = createDecorator("shortcutService");

export class ShortcutService {
  private readonly _registeredShortcuts: {
    [code: string]: {
      [id: string]: {
        handler: (...args: any[]) => void;
        preventDefault: boolean;
        stopPropagation: boolean;
      };
    };
  } = {};

  private readonly _registeredShortcutsInInputField: {
    [code: string]: {
      [id: string]: {
        handler: (...args: any[]) => void;
        preventDefault: boolean;
        stopPropagation: boolean;
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

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (this._registeredShortcutsInInputField[shortcut]) {
          const handlerId = (
            Object.keys(this._registeredShortcutsInInputField[shortcut])
              .length - 1
          ).toString();

          if (
            this._registeredShortcutsInInputField[shortcut][handlerId]
              ?.preventDefault
          ) {
            e.preventDefault();
          }

          this._registeredShortcutsInInputField[shortcut][handlerId]?.handler(
            e
          );

          if (
            this._registeredShortcutsInInputField[shortcut][handlerId]
              ?.stopPropagation
          ) {
            e.stopPropagation();
          }
        }
      } else {
        if (this._registeredShortcuts[shortcut]) {
          const handlerId = (
            Object.keys(this._registeredShortcuts[shortcut]).length - 1
          ).toString();

          if (this._registeredShortcuts[shortcut][handlerId]?.preventDefault) {
            e.preventDefault();
          }

          this._registeredShortcuts[shortcut][handlerId]?.handler(e);

          if (this._registeredShortcuts[shortcut][handlerId]?.stopPropagation) {
            e.stopPropagation();
          }
        }
        if (this._registeredShortcutsInInputField[shortcut]) {
          const handlerId = (
            Object.keys(this._registeredShortcutsInInputField[shortcut])
              .length - 1
          ).toString();

          if (
            this._registeredShortcutsInInputField[shortcut][handlerId]
              ?.preventDefault
          ) {
            e.preventDefault();
          }

          this._registeredShortcutsInInputField[shortcut][handlerId]?.handler(
            e
          );

          if (
            this._registeredShortcutsInInputField[shortcut][handlerId]
              ?.stopPropagation
          ) {
            e.stopPropagation();
          }
        }
      }
    });
  }

  register(
    code: string,
    handler: (...args: any[]) => void,
    preventDefault: boolean = true,
    stopPropagation: boolean = true
  ) {
    if (!this._registeredShortcuts[code]) {
      this._registeredShortcuts[code] = {};
    }

    const id = Object.keys(this._registeredShortcuts[code]).length.toString();
    this._registeredShortcuts[code][id] = {
      handler,
      preventDefault,
      stopPropagation,
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

  registerInInputField(
    code: string,
    handler: (...args: any[]) => void,
    preventDefault: boolean = true,
    stopPropagation: boolean = true
  ) {
    if (!this._registeredShortcutsInInputField[code]) {
      this._registeredShortcutsInInputField[code] = {};
    }

    const id = Object.keys(
      this._registeredShortcutsInInputField[code]
    ).length.toString();
    this._registeredShortcutsInInputField[code][id] = {
      handler,
      preventDefault,
      stopPropagation,
    };

    // Auto dispose when vue component is destroyed
    if (getCurrentScope()) {
      onScopeDispose(() => {
        delete this._registeredShortcutsInInputField[code][id];
      });
    }

    return () => {
      delete this._registeredShortcutsInInputField[code][id];
    };
  }
}
