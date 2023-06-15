import { Store } from "pinia";

import { createDecorator } from "@/base/injection/injection";
import {
  ISelectionState,
  defineSelectionState,
} from "@/services/state-service/state//selection";
import {
  IBufferState,
  defineBufferState,
} from "@/services/state-service/state/buffer";
import { IDBState, defineDBState } from "@/services/state-service/state/db";
import { ILogState, defineLogState } from "@/services/state-service/state/log";
import {
  IViewState,
  defineViewState,
} from "@/services/state-service/state/view";

export const IStateService = createDecorator("stateService");

/**
 * State service.
 * It is a wrapper of multiple pinia states used to control the UI.
 */
export class StateService {
  readonly logState: Store<string, ILogState>;
  readonly viewState: Store<string, IViewState>;
  readonly bufferState: Store<string, IBufferState>;
  readonly dbState: Store<string, IDBState>;
  readonly selectionState: Store<string, ISelectionState>;

  constructor() {
    this.logState = this.useLogState();
    this.viewState = this.useViewState();
    this.bufferState = this.useBufferState();
    this.dbState = this.useDBState();
    this.selectionState = this.useSelectionState();
  }

  useLogState = defineLogState;
  useViewState = defineViewState;
  useBufferState = defineBufferState;
  useDBState = defineDBState;
  useSelectionState = defineSelectionState;

  /**
   * Get a state by key. Usually used in the extension process.
   * In the main renderer process, the state can be accessed directly by the property name.
   * @param key - The key of the state. Such as "viewState.os"
   * @returns
   */
  get(key: string) {
    const [stateId, stateKey] = key.split(".");
    if (!stateKey) {
      throw new Error(`Invalid state key: ${key}`);
    }
    return this[stateId][stateKey];
  }

  /**
   * Set a state by key. Usually used in the extension process.
   * In the main renderer process, the state can be accessed directly by the property name.
   * @param patch - The patch object. Such as { "viewState.os": "win32" }
   * @returns
   */
  set(patch: { [key: string]: any }) {
    const statePatchs = {};
    for (const key in patch) {
      const [stateId, stateKey] = key.split(".");
      if (!stateKey) {
        throw new Error(`Invalid state key: ${key}`);
      }

      if (!statePatchs[stateId]) {
        statePatchs[stateId] = {};
      }
      statePatchs[stateId][stateKey] = patch[key];
    }

    for (const stateId in statePatchs) {
      this[stateId].$patch(statePatchs[stateId]);
    }
  }

  // /**
  //  * Add a change listener
  //  * @param key - key(s)
  //  * @param callback - callback function
  //  * @returns
  //  */
  // onChanged(key: string | string[], callback: (newValue: any) => void) {
  //   if (typeof key === "string") {
  //     key = [key];
  //   }
  //   for (const k of key) {
  //     if (!(k in this._listeners)) {
  //       this._listeners[k] = [];
  //     }
  //     this._listeners[k].push(callback);
  //   }
  // }
}
