import { ipcMain } from "electron";

export type Dto<T> = T extends { toJSON(): infer U }
  ? U
  : T extends string // VSBuffer is understood by rpc-logic
  ? T
  : T extends Function // functions are dropped during JSON-stringify
  ? never
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

  constructor() {
    this._locals = {};
  }

  public set<T>(rpcId: string, value: T) {
    // iter all function of value
    // for each function, create a channel name as `${rpcId}.${functionName}`
    // and register a ipcMain.handle with channel name and function
    for (const key of Object.getOwnPropertyNames(
      Object.getPrototypeOf(value)
    )) {
      if (typeof value[key] === "function" && key !== "constructor") {
        const channelName = `${rpcId}.${key}`;
        if (!this._locals[channelName]) {
          this._locals[channelName] = value[key];
          ipcMain.handle(channelName, (event, args) => {
            return (value[key] as Function)(
              ...args,
              browserWindows.getRealId(event.sender.id)
            );
          });
        }
      }
    }
  }

  public getProxy<T>(rpcId: string): Proxied<T> {
    throw new Error("Method not implemented.");
  }
}
