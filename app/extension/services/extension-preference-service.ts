import ElectronStore from "electron-store";
import keytar from "keytar";
import path from "path";

import { errorcatching } from "@/base/error";
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
        if (value.type === "options") {
          const curValue = this._store.get(key);

          curValue.options = value.options;
          if (curValue.options[curValue.value]) {
            curValue.value = curValue.options[0];
          }
          this._store.set(key, curValue);
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
      const value = this._store.get(key).value;
      return value;
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

  /**
   * Register a preference store.
   * @param extensionID - extension ID
   * @param defaultPreference - default preference
   */
  @errorcatching(
    "Failed to register preference store.",
    true,
    "ExtPreferenceService"
  )
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

  /**
   * Unregister a preference store.
   * @param extensionID - extension ID
   */
  @errorcatching(
    "Failed to unregister preference store.",
    true,
    "ExtPreferenceService"
  )
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
  @errorcatching(
    "Failed to get preference.",
    true,
    "ExtPreferenceService",
    null
  )
  get(extensionID: string, key: any) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    return this._stores[extensionID].get(key);
  }

  /**
   * Get the value of all preferences
   * @param extensionID - extension ID
   * @returns value of all preferences
   */
  @errorcatching(
    "Failed to get all preferences.",
    true,
    "ExtPreferenceService",
    {}
  )
  getAll(extensionID: string) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    const preference = new Map<string, any>();

    for (const [key, pref] of Object.entries(
      this._stores[extensionID]._store.store
    ).sort((a, b) => {
      if (
        (a as any)[1].hasOwnProperty("order") &&
        (b as any)[1].hasOwnProperty("order")
      ) {
        if ((a as any)[1].order === (b as any)[1].order) {
          return (a as any)[1].name > (b as any)[1].name ? 1 : -1;
        } else {
          return (a as any)[1].order > (b as any)[1].order ? 1 : -1;
        }
      } else {
        return (a as any)[1].name > (b as any)[1].name ? 1 : -1;
      }
    })) {
      preference.set(key, (pref as any).value);
    }

    return preference;
  }

  /**
   * Get the metadata of the preference
   * @param extensionID - extension ID
   * @param key - key of the preference
   * @returns metadata of the preference or null
   */
  @errorcatching(
    "Failed to get preference metadata.",
    true,
    "ExtPreferenceService",
    null
  )
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
  @errorcatching(
    "Failed to get all preferences metadata.",
    true,
    "ExtPreferenceService",
    {}
  )
  getAllMetadata(extensionID: string) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    const metadata = new Map<string, any>();

    for (const [key, pref] of Object.entries(
      this._stores[extensionID]._store.store
    ).sort((a, b) => {
      if (
        (a as any)[1].hasOwnProperty("order") &&
        (b as any)[1].hasOwnProperty("order")
      ) {
        if ((a as any)[1].order === (b as any)[1].order) {
          return (a as any)[1].name > (b as any)[1].name ? 1 : -1;
        } else {
          return (a as any)[1].order > (b as any)[1].order ? 1 : -1;
        }
      } else {
        return (a as any)[1].name > (b as any)[1].name ? 1 : -1;
      }
    })) {
      metadata.set(key, pref);
    }

    return metadata;
  }

  /**
   * Set the value of the preference
   * @param extensionID - extension ID
   * @param patch - patch object
   * @returns
   */
  @errorcatching("Failed to set preference.", true, "ExtPreferenceService")
  set(extensionID: string, patch: any) {
    if (!this._stores[extensionID]) {
      throw new Error(`Preference store for ${extensionID} does not exist.`);
    }

    this._stores[extensionID].set(patch);
  }

  /**
   * Get the password
   * @param extensionID - extension ID
   * @param key - key of the password
   * @returns - password
   */
  @errorcatching("Failed to get password.", true, "ExtPreferenceService", null)
  async getPassword(extensionID: string, key: string) {
    return await keytar.getPassword(extensionID, key);
  }

  /**
   * Set the password
   * @param extensionID - extension ID
   * @param key - key of the password
   * @param pwd - password
   */
  @errorcatching("Failed to set password.", true, "ExtPreferenceService")
  async setPassword(extensionID: string, key: string, pwd: string) {
    await keytar.setPassword(extensionID, key, pwd);
  }

  onChanged(
    target: any | any[],
    callback: (newValues: { key: any; value: any }) => void
  ) {
    const disposeCallbacks: (() => void)[] = [];

    if (typeof target === "string") {
      target = [target];
    }

    for (const extensionIDKey of target as string[]) {
      const components = extensionIDKey.split(":");

      if (components.length !== 2) {
        throw new Error(`Invalid key ${extensionIDKey}.`);
      }

      const [extensionID, keys] = extensionIDKey.split(":");

      if (!this._stores[extensionID]) {
        throw new Error(`Preference store for ${extensionID} does not exist.`);
      }

      disposeCallbacks.push(
        this._stores[extensionID].onChanged(keys, callback)
      );
    }

    return () => {
      for (const disposeCallback of disposeCallbacks) {
        disposeCallback();
      }
    };
  }

  on = this.onChanged;
}
