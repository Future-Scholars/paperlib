import {
  Store,
  SubscriptionCallbackMutationPatchObject,
  defineStore,
} from "pinia";

import { uid } from "@/utils/misc";

interface IEventState {
  [key: string]: any;
}

export class Eventable {
  private readonly _state: Store<string, IEventState>;
  private readonly _listeners: {
    [key: string]: { [callbackId: string]: (value: any) => void };
  };
  private readonly _eventGroupId: string;

  constructor(eventGroupId: string) {
    this._eventGroupId = eventGroupId;

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
      state: (): IEventState => ({}),
    })();
  }

  /**
   * Fire an event
   * @param event - event name or object of events
   * @returns
   */
  fire(event: { [key in keyof IEventState]?: any } | keyof IEventState) {
    let patch: { [key in keyof IEventState]?: any } = {};
    if (typeof event === "string") {
      patch[event] = this._state[event] + 1;
    } else {
      patch = event as { [key in keyof IEventState]?: any };
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
