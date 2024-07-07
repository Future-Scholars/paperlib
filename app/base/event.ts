import { EventEmitter } from "eventemitter3";
import { isEqual } from "lodash";

import { IDisposable } from "@/base/dispose";

export interface IEventState {
  [key: string]: any;
}

/**
 * A eventable base class.
 * There is two ways to fire a event:
 *   1. Fire a single event by calling `fire(event: string)` / Fire multiple events by calling `fire(events: { [key in keyof T]?: any })`
 *   2. Directly modify the state by calling `useState().key = value`
 */
export class Eventable<T extends IEventState> implements IDisposable {
  protected readonly _eventGroupId: string;
  protected readonly _eventDefaultState: T;
  protected readonly _eventState: T;
  protected _eventStateProxy?: T;

  protected readonly _emitter: EventEmitter;

  constructor(eventGroupId: string, eventDefaultState?: T) {
    this._eventGroupId = eventGroupId;
    this._eventDefaultState = eventDefaultState || ({} as T);
    this._eventState = eventDefaultState || ({} as T);

    this._emitter = new EventEmitter();
  }

  useState(): T {
    if (this._eventStateProxy) {
      return this._eventStateProxy;
    } else {
      this._eventStateProxy = new Proxy(this._eventState, {
        get: (target, prop) => {
          return target[prop as keyof T];
        },
        set: (_target, prop, value) => {
          this.fire({ [prop as any]: value }, true);
          return true;
        },
      });

      return this._eventStateProxy;
    }
  }

  async bindState() {
    // Handle in the messageport protocol
    // This function is used to bind the remote state with the local pinia state in the renderer process
  }

  getState(key: keyof T) {
    return this._eventState[key];
  }

  /**
   * Fire an event
   * @param event - event name or object of events
   * @returns
   */
  fire(
    event: { [key in keyof T]?: any } | keyof T,
    onlyIfChanged: boolean = false
  ) {
    let patch: Partial<T> = {};
    if (typeof event === "string") {
      patch = { [event]: this._eventState[event] + 1 } as Partial<T>;
    } else if (typeof event === "object") {
      patch = event as Partial<T>;
    } else {
      throw new Error("Invalid event type: " + typeof event);
    }

    for (const [key, value] of Object.entries(patch)) {
      if (isEqual(this._eventState[key], value) && onlyIfChanged) {
        continue;
      }
      this._emitter.emit(key, value);
      this._eventState[key as keyof T] = value;
    }
  }

  setState = this.fire;

  /**
   * Add a listener
   * @param key - key(s) of the event
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

    for (const k of key as Array<string>) {
      this._emitter.on(k, (v) => {
        callback({ key: k as keyof T, value: v });
      });
    }

    return () => {
      for (const k of key as Array<string>) {
        this._emitter.off(k as string, (v) => {
          callback({ key: k as keyof T, value: v });
        });
      }
    };
  }

  /**
   * Add a listener
   * @param key - key(s) of the event
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
    for (const k of key as Array<string>) {
      if (
        !isEqual(
          this._eventState[k as keyof T],
          this._eventDefaultState[k as keyof T]
        )
      ) {
        callback({ key: k, value: this._eventState[k] });
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

    this._emitter.removeAllListeners();
  }
}
