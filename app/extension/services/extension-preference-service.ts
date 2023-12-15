import ElectronStore from "electron-store";
import keytar from "keytar";
import path from "path";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";

class ExtensionPreferenceStore<
  T extends { [key: string]: any }
> extends Eventable<T> {
  readonly _store: ElectronStore<any>;

  constructor(
    extensionID: string,
    defaultValues: T,
    preferenceFilePath?: string
  ) {
    super(`${extensionID}-preferenceStore`, defaultValues);

    this._store = new ElectronStore({
      name: extensionID,
      cwd: preferenceFilePath,
    });

    for (const [key, value] of Object.entries(defaultValues)) {
      if (!this._store.has(key)) {
        this._store.set(key, value);
      } else {
        if (typeof value === "object" && !(value instanceof Array)) {
          const oldValue = this._store.get(key);
          for (const [subKey, subValue] of Object.entries(value)) {
            if (!(subKey in oldValue)) {
              oldValue[subKey] = subValue;
            }
          }
          this._store.set(key, oldValue);
        }
      }
    }
  }

  /**
   * Get the value of the preference
   * @param key - key of the preference
   * @returns value of the preference or null
   */
  get(key: any) {
    if (this._store.has(key)) {
      const value = this._store.get(key);
      if (value.value !== undefined) {
        return value.value;
      } else {
        return value;
      }
    } else {
      return null;
    }
  }

  /**
   * Get the metadata of the preference
   * @param key - key of the preference
   * @returns metadata of the preference or null
   */
  getMetadata(key: any) {
    if (this._store.has(key)) {
      return this._store.get(key);
    } else {
      return null;
    }
  }

  /**
   * Set the value of the preference
   * @param patch - patch object
   * @returns
   */
  set(patch: any) {
    const newData = {};
    for (const key in patch) {
      if (this._store.has(key)) {
        newData[key] = this.getMetadata(key);
        newData[key].value = patch[key];
      }
    }
    this._store.set(newData);
    this.fire(newData);
  }
}

export const IExtensionPreferenceService = createDecorator(
  "extensionPreferenceService"
);

/**
 * Extension preference service.
 * It is a wrapper of ElectronStore with responsive states.
 */
export class ExtensionPreferenceService {
  private readonly _stores: {
    [extensionID: string]: ExtensionPreferenceStore<any>;
  };

  constructor() {
    this._stores = {};
  }

  async register<T extends { [key: string]: any }>(
    extensionID: string,
    defaultPreference: T
  ) {
    if (this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} already exists.`);
    }

    const preferenceFilePath = path.join(globalThis["extensionWorkingDir"]);

    this._stores[extensionID] = new ExtensionPreferenceStore<T>(
      extensionID,
      defaultPreference,
      preferenceFilePath
    );
  }

  unregister(extensionID: string) {
    if (!this._stores[extensionID]) {
      return;
    }

    delete this._stores[extensionID];
  }

  /**
   * Get the value of the preference
   * @param extensionID - extension ID
   * @param key - key of the preference
   * @returns value of the preference or null
   */
  get(extensionID: string, key: any) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    return this._stores[extensionID].get(key);
  }

  getAll(extensionID: string) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    const preference = {};

    for (const key in this._stores[extensionID]._store.store) {
      preference[key] = this._stores[extensionID].get(key);
    }

    return preference;
  }

  /**
   * Get the metadata of the preference
   * @param extensionID - extension ID
   * @param key - key of the preference
   * @returns metadata of the preference or null
   */
  getMetadata(extensionID: string, key: any) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    return this._stores[extensionID].getMetadata(key);
  }

  /**
   * Get the metadata of all preferences
   * @param extensionID - extension ID
   * @returns metadata of all preferences
   */
  getAllMetadata(extensionID: string) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    return this._stores[extensionID]._store.store;
  }

  /**
   * Set the value of the preference
   * @param extensionID - extension ID
   * @param patch - patch object
   * @returns
   */
  set(extensionID: string, patch: any) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    this._stores[extensionID].set(patch);
  }

  async getPassword(extensionID: string, key: string) {
    return await keytar.getPassword(extensionID, key);
  }

  async setPassword(extensionID: string, key: string, pwd: string) {
    await keytar.setPassword(extensionID, key, pwd);
  }

  onChanged<T>(
    extensionID: string,
    key: keyof T | (keyof T)[],
    callback: (newValues: { key: any; value: any }) => void
  ) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }
    return this._stores[extensionID].onChanged(key, callback);
  }

  on = this.onChanged;
}
