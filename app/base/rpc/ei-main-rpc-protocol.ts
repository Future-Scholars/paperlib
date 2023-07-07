import { ipcMain } from "electron";
import { Eventable } from "../event";
import { WindowStorage } from "@/main/window-storage";

export type Dto<T> = T extends { toJSON(): infer U }
  ? U
  : T extends string // VSBuffer is understood by rpc-logic
  ? T
  : T extends object // recurse
  ? { [k in keyof T]: Dto<T[k]> }
  : T;

export type Proxied<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: { [K in keyof A]: Dto<A[K]> }) => Promise<Dto<Awaited<R>>>
    : never;
};

/**
 * Electron ipcMain (EI) based RPC Protocol*/
export class EIMainRPCProtocol {
  private readonly _locals: { [id: string]: any };
  private readonly _browserWindows: WindowStorage;

  constructor(browserWindows: WindowStorage) {
    this._locals = {};
    this._browserWindows = browserWindows;
  }

  public set<T>(rpcId: string, value: T) {
    // Set actionor.
    // iter all function of value
    // for each function, create a channel name as `${rpcId}.${functionName}`
    // and register a ipcMain.handle with channel name and function
    for (const key of Object.getOwnPropertyNames(
      Object.getPrototypeOf(value)
    )) {
      if (
        typeof value[key] === "function" &&
        key !== "constructor" &&
        key !== "on" &&
        key !== "useState" &&
        key !== "fire" &&
        key !== "onChanged" &&
        key !== "already" &&
        key !== "dispose"
      ) {
        const channelName = `${rpcId}.${key}`;
        if (!this._locals[channelName]) {
          this._locals[channelName] = value[key];

          if (channelName.endsWith("Sync")) {
            ipcMain.on(channelName, async (event, args) => {
              const result = (value[key] as Function)(...args);

              // check is a promise
              if (result && result.then) {
                event.returnValue = await result;
              } else {
                event.returnValue = result;
              }
            });
          } else {
            ipcMain.handle(channelName, async (event, args) => {
              const result = (value[key] as Function)(...args);

              // check is a promise
              if (result && result.then) {
                return await result;
              } else {
                return result;
              }
            });
          }
        }
      }
    }

    if (value instanceof Eventable) {
      for (const eventName of value.getEvents()) {
        const signal = `${rpcId}.${eventName}`;

        value.on(eventName, (value) => {
          console.log("event", signal, value);
          for (const [windowId, window] of Object.entries(
            this._browserWindows.all()
          )) {
            window.webContents.send(signal, value);
          }
        });
      }
    }
  }

  public getProxy<T>(rpcId: string): Proxied<T> {
    throw new Error("Method not implemented.");
  }
}
