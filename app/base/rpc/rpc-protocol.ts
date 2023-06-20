// Thanks to https://github.dev/microsoft/vscode/
import { MessagePortMain } from "electron";

import { LazyPromise } from "./lazy-promise";

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

export enum MessageType {
  request = 0,
  replySuccess = 1,
  replyError = 2,
}

// Now only consider MessagePort as the communication channel
export class RPCProtocol {
  private readonly _port: MessagePort | MessagePortMain;
  private readonly _proxies: { [id: string]: Proxied<any> };
  private readonly _locals: { [id: string]: any };

  private _lastCallId: number;
  private readonly _pendingRPCReplies: { [callId: string]: LazyPromise };

  constructor(port: MessagePortMain | MessagePort) {
    this._port = port;
    this._proxies = {};
    this._locals = {};
    this._pendingRPCReplies = {};

    this._lastCallId = 0;

    if (this._port instanceof MessagePort) {
      (this._port as MessagePort).onmessage = (event) => {
        this._receiveOneMessage(event.data);
      };
    } else {
      (this._port as MessagePortMain).on("message", (event) => {
        this._receiveOneMessage(event.data);
      });
    }
    this._port.start();
  }

  public set<T>(rpcId: string, value: T) {
    this._locals[rpcId] = value;
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
            return this._remoteCall(rpcId, name, myArgs);
          };
        }
        return target[name];
      },
    };
    return new Proxy(Object.create(null), handler);
  }

  private _remoteCall(
    rpcId: string,
    methodName: string,
    args: any[]
  ): Promise<any> {
    const callId = String(++this._lastCallId);
    const result = new LazyPromise();

    this._pendingRPCReplies[callId] = result;
    const msg = JSON.stringify({
      callId,
      rpcId,
      type: MessageType.request,
      value: {
        methodName,
        args,
      },
    });
    this._port.postMessage(msg);
    return result;
  }

  private _receiveOneMessage(rawmsg: string): void {
    const { callId, rpcId, type, value } = JSON.parse(rawmsg);

    switch (type) {
      case MessageType.request: {
        this._receiveRequest(callId, rpcId, value.methodName, value.args);
        break;
      }
      case MessageType.replySuccess: {
        this._receiveReply(callId, value);
        break;
      }
      case MessageType.replyError: {
        this._receiveError(callId, value);
        break;
      }
      default:
        console.error(`received unexpected message`);
        console.error(rawmsg);
    }
  }

  private _receiveRequest(
    callId: string,
    rpcId: string,
    method: string,
    args: any[]
  ): void {
    let promise: Promise<any>;
    promise = this._invokeHandler(rpcId, method, args);
    promise.then(
      (r) => {
        const msg = JSON.stringify({
          callId,
          type: MessageType.replySuccess,
          value: r,
        });
        this._port.postMessage(msg);
      },
      (err) => {
        const msg = JSON.stringify({
          callId,
          type: MessageType.replyError,
          value: err,
        });
        this._port.postMessage(msg);
      }
    );
  }

  private _invokeHandler(
    rpcId: string,
    methodName: string,
    args: any[]
  ): Promise<any> {
    try {
      return Promise.resolve(this._doInvokeHandler(rpcId, methodName, args));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private _doInvokeHandler(
    rpcId: string,
    methodName: string,
    args: any[]
  ): any {
    const actor = this._locals[rpcId];
    if (!actor) {
      throw new Error("Unknown actor " + rpcId);
    }
    const method = actor[methodName];
    if (typeof method !== "function") {
      throw new Error("Unknown method " + methodName + " on actor " + rpcId);
    }
    return method.apply(actor, args);
  }

  private _receiveReply(callId: string, value: any): void {
    if (!this._pendingRPCReplies.hasOwnProperty(callId)) {
      return;
    }

    const pendingReply = this._pendingRPCReplies[callId];
    delete this._pendingRPCReplies[callId];

    pendingReply.resolve(value);
  }

  private _receiveError(callId: string, value: any): void {
    if (!this._pendingRPCReplies.hasOwnProperty(callId)) {
      return;
    }

    const pendingReply = this._pendingRPCReplies[callId];
    delete this._pendingRPCReplies[callId];

    pendingReply.reject(value);
  }
}
