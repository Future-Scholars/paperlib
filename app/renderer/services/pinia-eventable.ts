import { isEqual } from "lodash";
import {
  createPinia,
  defineStore,
  getActivePinia,
  setActivePinia,
  Store,
} from "pinia";

import { Eventable } from "@/base/event";

export interface IEventState {
  [key: string]: any;
}

/**
 * A eventable base class.
 * There is two ways to fire a event:
 *   1. Fire a single event by calling `fire(event: string)` / Fire multiple events by calling `fire(events: { [key in keyof T]?: any })`
 *   2. Directly modify the state by calling `useState().key = value`
 */
export class PiniaEventable<T extends IEventState> extends Eventable<T> {
  protected readonly _piniaStore: Store;
  protected _piniaStoreProxy?: T;
  private _selfEventDisposeCallback?: () => void;

  constructor(eventGroupId: string, eventDefaultState?: T) {
    super(eventGroupId, eventDefaultState);
    if (!getActivePinia()) {
      setActivePinia(createPinia());
    }

    this._piniaStore = defineStore(`${eventGroupId}-store`, {
      state: () => {
        return JSON.parse(JSON.stringify(eventDefaultState || {}));
      },
    })();

    // @ts-ignore
    this._piniaStore.$patchupdate = (patch: any, direct = false) => {
      const realPatch: any = {};
      for (const key in patch) {
        if (
          this._piniaStore[key] === undefined ||
          isEqual(patch[key], this._piniaStore[key])
        ) {
          continue;
        } else {
          realPatch[key] = patch[key];
        }
      }
      if (Object.keys(realPatch).length > 0) {
        if (direct) {
          this.fire(realPatch);
        } else {
          this._piniaStore.$patch(realPatch);
        }
      }
    };

    this._selfEventDisposeCallback = this.on(
      Array.from(Object.keys(eventDefaultState || {})),
      (newValue: { key: keyof T; value: any }) => {
        // @ts-ignore
        this._piniaStore.$patchupdate({ [newValue.key]: newValue.value });
      }
    );
  }

  useState() {
    if (this._piniaStoreProxy) {
      return this._piniaStoreProxy;
    } else {
      this._piniaStoreProxy = new Proxy(this._piniaStore, {
        get: (target, prop) => {
          return target[prop as any];
        },
        set: (target, prop, value) => {
          // @ts-ignore
          target.$patchupdate({ [prop]: value }, true);
          return true;
        },
      }) as unknown as T;
      return this._piniaStoreProxy;
    }
  }

  dispose() {
    if (this._selfEventDisposeCallback) {
      this._selfEventDisposeCallback();
    }
    super.dispose();
  }
}
