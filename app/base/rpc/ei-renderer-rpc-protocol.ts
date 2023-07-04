import { ipcRenderer } from "electron";

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
 * Electron ipcRenderer (EI) based RPC Protocol*/
export class EIRendererRPCProtocol {
  private readonly _proxies: { [id: string]: Proxied<any> };

  constructor() {
    this._proxies = {};
  }

  public getProxy<T>(rpcId: string): Proxied<T> {
    if (!this._proxies[rpcId]) {
      this._proxies[rpcId] = this._createProxy(rpcId);
    }
    return this._proxies[rpcId];
  }

  private _createProxy<T>(rpcId: string): T {
    const handler = {
      get: (target: any, name: PropertyKey) => {
        if (typeof name === "string" && !target[name]) {
          target[name] = (...myArgs: any[]) => {
            console.log("invoke", `${rpcId}.${name}`, myArgs);

            if (name.endsWith("Sync")) {
              return ipcRenderer.sendSync(`${rpcId}.${name}`, myArgs);
            } else {
              return ipcRenderer.invoke(`${rpcId}.${name}`, myArgs);
            }
          };
        }
        return target[name];
      },
    };
    return new Proxy(Object.create(null), handler);
  }

  public set<T>(rpcId: string, value: T) {}
}
