import { BrowserWindow } from "electron";

export class WindowStorage {
  private readonly _windows: Record<string, BrowserWindow>;
  private readonly _wId2Id: Record<number, string>;

  constructor() {
    this._windows = {};
    this._wId2Id = {};

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        } else {
          return this.get(prop as string | number);
        }
      },
      set: (target, prop, value) => {
        if (prop in target) {
          target[prop] = value;
        } else {
          this.set(prop as string, value as BrowserWindow);
        }
        return true;
      },
      deleteProperty: (target, prop) => {
        if (prop in target) {
          delete target[prop];
        } else {
          this.destroy(prop as string | number);
        }
        return true;
      },
    });
  }

  get(id: string | number): BrowserWindow {
    if (typeof id === "string") {
      return this._windows[id];
    } else {
      return this._windows[this._wId2Id[id]];
    }
  }

  getRealId(id: string | number) {
    if (typeof id === "string") {
      return id;
    } else {
      return this._wId2Id[id];
    }
  }

  all(): Record<string, BrowserWindow> {
    return this._windows;
  }

  set(id: string, window: BrowserWindow): void {
    if (typeof id === "string") {
      this._windows[id] = window;
      this._wId2Id[window.id] = id;
    } else {
      throw new Error("Invalid window id type");
    }
  }

  destroy(id: string | number): void {
    try {
      let window: BrowserWindow;
      if (typeof id === "string") {
        window = this._windows[id as string];
      } else {
        window = this._windows[this._wId2Id[id]];
      }
      const windowId = window.id;
      if (window && !window.isDestroyed()) {
        window.destroy();
      }
      delete this._wId2Id[windowId];
      delete this._windows[id as string];
    } catch (e) {
      console.error(e);
    }
  }

  has(id: string | number): boolean {
    if (typeof id === "string") {
      return id in this._windows && !this._windows[id].isDestroyed();
    } else {
      return (
        this._wId2Id[id] in this._windows &&
        !this._windows[this._wId2Id[id]].isDestroyed()
      );
    }
  }
}
