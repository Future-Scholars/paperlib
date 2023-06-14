import {
  Store,
  SubscriptionCallbackMutationPatchObject,
  _DeepPartial,
  defineStore,
} from "pinia";
import { UnwrapRef } from "vue";

import { uid } from "@/utils/misc";

interface IEventState {
  [key: string]: any;
}

/**
 * A eventable base class.
 * There is two ways to fire a event:
 *   1. Fire a single event by calling `fire(event: string)` / Fire multiple events by calling `fire(events: { [key in keyof T]?: any })`
 *   2. Directly modify the state by calling `useState().key = value`
 */
export class Eventable<T extends IEventState> {
  private readonly _state: Store<string, T>;
  private readonly _listeners: {
    [key: string]: { [callbackId: string]: (value: any) => void };
  };
  private readonly _eventGroupId: string;
  private readonly _eventDefaultState: T;

  constructor(eventGroupId: string, eventDefaultState?: T) {
    this._eventGroupId = eventGroupId;
    this._eventDefaultState = eventDefaultState || ({} as T);

    this._listeners = {};
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
          const callbacks = this._listeners[key];
          const callbacksPromise = Object.values(callbacks).map((callback) => {
            return new Promise((resolve) => {
              resolve(callback(payload[key]));
            });
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
  onChanged(key: string | string[], callback: (newValue: any) => void) {
    if (typeof key === "string") {
      key = [key];
    }

    const keyAndCallbackId: string[][] = [];
    for (const k of key) {
      if (!(k in this._listeners)) {
        this._listeners[k] = {};
      }
      const callbackId = uid();
      this._listeners[k][callbackId] = callback;
      keyAndCallbackId.push([k, callbackId]);
    }

    return () => {
      for (const [k, callbackId] of keyAndCallbackId) {
        console.log("Dispose", k, callbackId);
        delete this._listeners[k][callbackId];
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
}
