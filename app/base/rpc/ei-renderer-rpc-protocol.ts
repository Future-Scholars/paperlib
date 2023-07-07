import { ipcRenderer } from "electron";
import { uid } from "@/base/misc";
import { Proxied } from "@/base/rpc/proxied";

/**
 * Electron ipcRenderer (EI) based RPC Protocol*/
export class EIRendererRPCProtocol {
  private readonly _proxies: { [id: string]: Proxied<any> };
  private readonly _eventListeners: Record<
    string,
    { [callbackId: string]: (value: any) => void }
  >;

  constructor() {
    this._proxies = {};
    this._eventListeners = {};
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
            if (name.endsWith("Sync")) {
              // console.log("sendSync", `${rpcId}.${name}`, myArgs);
              return ipcRenderer.sendSync(`${rpcId}.${name}`, myArgs);
            } else if (
              name === "on" ||
              name === "onChanged" ||
              name === "onClick"
            ) {
              // console.log("on", `${rpcId}.${name}`, myArgs);

              let eventNames: string[] = myArgs[0];
              const callback = myArgs[1];

              if (typeof eventNames === "string") {
                eventNames = [eventNames];
              }

              const signalAndCallbackId: [string, string][] = [];
              for (const eventName of eventNames) {
                const signal = `${rpcId}.${eventName}`;

                const firstTimeRegister = !this._eventListeners[signal];
                this._eventListeners[signal] =
                  this._eventListeners[signal] || {};
                const callbackId = uid();
                const callbackList = this._eventListeners[signal]!;
                callbackList[callbackId] = callback;
                signalAndCallbackId.push([signal, callbackId]);

                if (firstTimeRegister) {
                  ipcRenderer.on(signal, (_, args) => {
                    const callbackList = this._eventListeners[signal];
                    for (const callbackId in callbackList) {
                      callbackList[callbackId](args);
                    }
                  });
                }
              }

              return () => {
                for (const [signal, callbackId] of signalAndCallbackId) {
                  delete this._eventListeners[signal]![callbackId];
                }
              };
            } else {
              // console.log("invoke", `${rpcId}.${name}`, myArgs);
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
