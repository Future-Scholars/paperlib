import {
  Store,
  SubscriptionCallbackMutationPatchObject,
  _DeepPartial,
  createPinia,
  defineStore,
  getActivePinia,
  setActivePinia,
} from "pinia";
import { UnwrapRef } from "vue";

import { IDisposable } from "@/base/dispose";
import { uid } from "@/base/misc";

interface IEventState {
  [key: string]: any;
}

/**
 * A eventable base class.
 * There is two ways to fire a event:
 *   1. Fire a single event by calling `fire(event: string)` / Fire multiple events by calling `fire(events: { [key in keyof T]?: any })`
 *   2. Directly modify the state by calling `useState().key = value`
 */
export class Eventable<T extends IEventState> implements IDisposable {
  protected readonly _state: Store<string, T>;
  protected readonly _listeners: Partial<
    Record<keyof T, { [callbackId: string]: (value: any) => void }>
  >;
  protected readonly _eventGroupId: string;
  protected readonly _eventDefaultState: T;

  constructor(eventGroupId: string, eventDefaultState?: T) {
    this._eventGroupId = eventGroupId;
    this._eventDefaultState = eventDefaultState || ({} as T);

    this._listeners = {};

    if (!getActivePinia()) {
      setActivePinia(createPinia());
    }

    this._state = this.useState();
    this._state.$subscribe((mutation, state) => {
      let payload: { [key: string]: any };
      if (mutation.type === "direct") {
        payload = { [mutation.events.key]: mutation.events.newValue };
      } else {
        payload = (
          mutation as SubscriptionCallbackMutationPatchObject<IEventState>
        ).payload;
      }
      for (const key in payload) {
        if (key in this._listeners) {
          const callbacks = this._listeners[key]!;
          const callbacksPromise = Object.values(callbacks).map((callback) => {
            // if callback is async
            if (callback.constructor.name === "AsyncFunction") {
              return callback({ key: key, value: payload[key] });
            } else {
              return new Promise((resolve) => {
                resolve(callback({ key: key, value: payload[key] }));
              });
            }
          });
          Promise.all(callbacksPromise);
        }
      }
    });
  }

  useState() {
    return defineStore(this._eventGroupId, {
      state: (): T => {
        return this._eventDefaultState;
      },
    })();
  }

  /**
   * Fire an event
   * @param event - event name or object of events
   * @returns
   */
  fire(event: { [key in keyof T]?: any } | keyof T) {
    let patch: _DeepPartial<UnwrapRef<T>> = {};
    if (typeof event === "string") {
      patch = { [event]: this._state[event] + 1 } as _DeepPartial<UnwrapRef<T>>;
    } else {
      patch = event as _DeepPartial<UnwrapRef<T>>;
    }
    this._state.$patch(patch);
  }

  /**
   * Add a listener to the preference
   * @param key - key(s) of the preference
   * @param callback - callback function
   * @returns
   */
  onChanged(
    key: keyof T | (keyof T)[],
    callback: (newValues: { key: keyof T; value: any }) => void
  ) {
    if (typeof key === "string") {
      key = [key];
    }

    const keyAndCallbackId: [keyof T, string][] = [];
    for (const k of key as (keyof T)[]) {
      this._listeners[k] = this._listeners[k] || {};
      const callbackId = uid();
      const callbackList = this._listeners[k]!;
      callbackList[callbackId] = callback;
      keyAndCallbackId.push([k, callbackId]);
    }

    return () => {
      for (const [k, callbackId] of keyAndCallbackId) {
        delete this._listeners[k]![callbackId];
      }
    };
  }

  /**
   * Add a listener to the preference
   * @param key - key(s) of the preference
   * @param callback - callback function
   * @returns
   */
  on = this.onChanged;

  already(
    key: keyof T | (keyof T)[],
    callback: (newValues: { key: keyof T; value: any }) => void
  ) {
    if (typeof key === "string") {
      key = [key];
    }

    const disposeCallbacks: (() => void)[] = [];
    for (const k of key as string[]) {
      if (this._state[k] !== this._eventDefaultState[k]) {
        callback({ key: k, value: this._state[k] });
      } else {
        disposeCallbacks.push(this.onChanged(k, callback));
      }
    }

    return () => {
      for (const disposeCallback of disposeCallbacks) {
        disposeCallback();
      }
    };
  }

  dispose() {
    for (var prop in this) {
      if (
        (this[prop] as any).hasOwnProperty("dispose") &&
        typeof (this[prop] as any).dispose === "function"
      ) {
        (this[prop] as any).dispose();
      }
    }
    for (var listener in this._listeners) {
      delete this._listeners[listener];
    }
  }
}
