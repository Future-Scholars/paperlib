// Thanks to https://github.dev/microsoft/vscode/
import { MessagePortMain } from "electron";

import { JSONparse, JSONstringify } from "@/base/json";
import { uid } from "@/base/misc";
import { LazyPromise } from "@/base/rpc/lazy-promise";
import { Proxied } from "@/base/rpc/proxied";

export enum MessageType {
  request = 0,
  replySuccess = 1,
  replyError = 2,
  listenEvent = 3,
  fireEvent = 4,
  disposeEvent = 5,
  exposeAPI = 6,
  registerHook = 7,
  disposeHook = 8,
  registerCommand = 9,
  disposeCommand = 10,
}

/**
 * MessagePort based RPC Protocol*/
export class MessagePortRPCProtocol {
  private readonly _port: MessagePort | MessagePortMain;
  private readonly _proxies: { [id: string]: Proxied<any> };
  private readonly _locals: { [id: string]: any };

  private _lastCallId: number;
  private readonly _pendingRPCReplies: { [callId: string]: LazyPromise };

  private readonly _callerId: string;
  private readonly _callWithCallerId: boolean;

  private readonly _eventListeners: Record<
    string,
    { [callbackId: string]: (value: any) => void }
  >;
  private readonly _eventDisposeCallbacks: Record<string, () => void>;

  private readonly _hookDisposeCallbacks: Record<string, () => void>;

  private readonly _commandDisposeCallbacks: Record<string, () => void>;

  public exposedAPIs: { [namespace: string]: string[] };

  constructor(
    port: MessagePortMain | MessagePort,
    callerId: string,
    callWithCallerId: boolean = false
  ) {
    this._port = port;
    this._proxies = {};
    this._locals = {};
    this._pendingRPCReplies = {};
    this._eventListeners = {};
    this._eventDisposeCallbacks = {};
    this.exposedAPIs = {};
    this._hookDisposeCallbacks = {};
    this._commandDisposeCallbacks = {};

    this._lastCallId = 0;

    this._callerId = callerId;
    this._callWithCallerId = callWithCallerId;

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
        if (
          typeof name === "string" &&
          (name === "on" || name === "onChanged" || name === "onClick")
        ) {
          target[name] = (...myArgs: any[]) => {
            return this._remoteEventListen(rpcId, myArgs[0], myArgs[1]);
          };
        } else if (
          typeof name === "string" &&
          (name === "hookModify" || name === "hookTransform") &&
          rpcId === "hookService"
        ) {
          target[name] = (...myArgs: any[]) => {
            return this._remoteHookRegister(rpcId, name, myArgs);
          };
        } else if (
          typeof name === "string" &&
          name === "registerExternel" &&
          rpcId === "commandService"
        ) {
          target[name] = (...myArgs: any[]) => {
            return this._remoteCommandRegister(rpcId, name, myArgs);
          };
        } else if (typeof name === "string" && !target[name]) {
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

    const msg = JSONstringify({
      callId,
      callerId: this._callerId,
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

  private _remoteEventListen(
    rpcId: string,
    eventNames: string[],
    callback: any
  ) {
    const callId = String(++this._lastCallId);

    if (typeof eventNames === "string") {
      eventNames = [eventNames];
    }

    const remoteEventNameAndCallbackId: [string, string][] = [];
    for (const eventName of eventNames) {
      const remoteEventName = `${rpcId}.${eventName}`;

      const firstTimeRegister = !this._eventListeners[remoteEventName];
      this._eventListeners[remoteEventName] =
        this._eventListeners[remoteEventName] || {};
      const callbackId = uid();
      this._eventListeners[remoteEventName]![callbackId] = callback;
      remoteEventNameAndCallbackId.push([remoteEventName, callbackId]);

      if (firstTimeRegister) {
        this._port.postMessage(
          JSONstringify({
            callId,
            callerId: this._callerId,
            rpcId,
            type: MessageType.listenEvent,
            value: {
              eventName,
            },
          })
        );
      }
    }

    return () => {
      for (const [
        remoteEventName,
        callbackId,
      ] of remoteEventNameAndCallbackId) {
        if (this._eventListeners[remoteEventName]) {
          delete this._eventListeners[remoteEventName][callbackId];

          if (Object.keys(this._eventListeners[remoteEventName]).length === 0) {
            delete this._eventListeners[remoteEventName];
          }
        }

        this._port.postMessage(
          JSONstringify({
            callId,
            callerId: this._callerId,
            rpcId,
            type: MessageType.disposeEvent,
          })
        );
      }
    };
  }

  // TODO: merge the following 2 functions
  private _remoteHookRegister(rpcId: string, methodName: string, args: any[]) {
    const callId = String(++this._lastCallId);

    const callbackId = uid();

    const msg = JSONstringify({
      callId,
      callerId: this._callerId,
      rpcId,
      type: MessageType.registerHook,
      value: {
        methodName,
        args,
        callbackId,
      },
    });

    this._port.postMessage(msg);

    return () => {
      this._port.postMessage(
        JSONstringify({
          callId,
          callerId: this._callerId,
          rpcId,
          type: MessageType.disposeHook,
          value: {
            callbackId,
          },
        })
      );
    };
  }

  private _remoteCommandRegister(
    rpcId: string,
    methodName: string,
    args: any[]
  ) {
    const callId = String(++this._lastCallId);

    const callbackId = uid();

    const msg = JSONstringify({
      callId,
      callerId: this._callerId,
      rpcId,
      type: MessageType.registerCommand,
      value: {
        methodName,
        args,
        callbackId,
      },
    });

    this._port.postMessage(msg);

    return () => {
      this._port.postMessage(
        JSONstringify({
          callId,
          callerId: this._callerId,
          rpcId,
          type: MessageType.disposeCommand,
          value: {
            callbackId,
          },
        })
      );
    };
  }

  private _receiveOneMessage(rawmsg: string): void {
    const { callId, callerId, rpcId, type, value } = JSONparse(rawmsg);

    switch (type) {
      case MessageType.request: {
        this._receiveRequest(
          callId,
          rpcId,
          callerId,
          value.methodName,
          value.args
        );
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
      case MessageType.fireEvent: {
        this._receiveEventFire(callId, rpcId, value);
        break;
      }
      case MessageType.listenEvent: {
        this._receiveEventListen(callId, rpcId, value);
        break;
      }
      case MessageType.disposeEvent: {
        this._receiveEventDispose(callId);
        break;
      }
      case MessageType.exposeAPI: {
        this._receiveExposedAPI(callId, value);
        break;
      }
      case MessageType.registerHook: {
        this._receiveHookRegister(callId, rpcId, value);
        break;
      }
      case MessageType.disposeHook: {
        this._receiveHookDispose(callId, rpcId, value);
        break;
      }
      case MessageType.registerCommand: {
        this._receiveCommandRegister(callId, rpcId, value);
        break;
      }
      case MessageType.disposeCommand: {
        this._receiveCommandDispose(callId, rpcId, value);
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
    callerId: string,
    method: string,
    args: any[]
  ): void {
    let promise: Promise<any>;
    promise = this._invokeHandler(rpcId, callerId, method, args);
    promise.then(
      (r) => {
        let msg: any;
        msg = JSONstringify({
          callId,
          type: MessageType.replySuccess,
          value: r,
        });
        this._port.postMessage(msg);
      },
      (err) => {
        const errObject = {
          name: err.name || "UnknownError",
          message: err.message || "",
          stack: err.stack || "",
        };

        const msg = JSONstringify({
          callId,
          type: MessageType.replyError,
          value: errObject,
        });
        this._port.postMessage(msg);
      }
    );
  }

  private _invokeHandler(
    rpcId: string,
    callerId: string,
    methodName: string,
    args: any[]
  ): Promise<any> {
    try {
      return Promise.resolve(
        this._doInvokeHandler(rpcId, callerId, methodName, args)
      );
    } catch (err) {
      return Promise.reject(err);
    }
  }

  protected _doInvokeHandler(
    rpcId: string,
    callerId: string,
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
    if (this._callWithCallerId) {
      return method.apply(actor, [callerId, ...args]);
    } else {
      return method.apply(actor, args);
    }
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

    const error = new Error(value.message);
    error.name = value.name;
    error.stack = value.stack;

    pendingReply.reject(error);
  }

  private _receiveEventListen(callId: string, rpcId: string, value: any): void {
    const { eventName } = value;

    const actor = this._locals[rpcId];
    if (!actor) {
      throw new Error("Unknown actor " + rpcId);
    }

    this._eventDisposeCallbacks[callId] = actor.on(eventName, (args: any[]) => {
      const msg = JSONstringify({
        callId,
        callerId: this._callerId,
        rpcId,
        type: MessageType.fireEvent,
        value: {
          eventName,
          args,
        },
      });

      this._port.postMessage(msg);
    });
  }

  private _receiveEventDispose(callId: string): void {
    const disposeCallback = this._eventDisposeCallbacks[callId];
    if (!disposeCallback) {
      return;
    }

    try {
      disposeCallback();
    } catch (e) {
      PLAPI.logService.error(
        `Failed to dispose event ${callId}`,
        createError(e),
        false,
        "RPC"
      );
    }
    delete this._eventDisposeCallbacks[callId];
  }

  private _receiveEventFire(callId: string, rpcId: string, value: any): void {
    const { eventName, args } = value;

    const remoteEventName = `${rpcId}.${eventName}`;

    const callbackList = this._eventListeners[remoteEventName];
    if (!callbackList) {
      return;
    }

    for (const callbackId in callbackList) {
      const callback = callbackList[callbackId];
      // if is sync function
      if (callback.constructor.name === "Function") {
        try {
          callback(args);
        } catch (e) {
          PLAPI.logService.error(
            `Failed to fire event ${eventName} on ${rpcId}`,
            createError(e),
            false,
            "RPC"
          );
        }
      } else if (callback.constructor.name === "AsyncFunction") {
        (callback as (args: any) => Promise<any>)(args).catch((e) => {
          PLAPI.logService.error(
            `Failed to fire event ${eventName} on ${rpcId}`,
            createError(e),
            false,
            "RPC"
          );
        });
      }
    }
  }

  public sendExposedAPI(namespace: string): void {
    const callId = String(++this._lastCallId);

    const msg = JSONstringify({
      callId,
      type: MessageType.exposeAPI,
      value: {
        [namespace]: Object.keys(this._locals),
      },
    });

    this._port.postMessage(msg);
  }

  private _receiveExposedAPI(
    callId: string,
    value: { [namespace: string]: string[] }
  ): void {
    for (const [namespace, APIs] of Object.entries(value)) {
      if (!globalThis[namespace]) {
        globalThis[namespace] = {};
      }
      if (!this.exposedAPIs[namespace]) {
        this.exposedAPIs[namespace] = [];
      }

      for (const API of APIs) {
        if (!globalThis[namespace][API]) {
          globalThis[namespace][API] = this.getProxy(API);
        }

        if (!this.exposedAPIs[namespace].includes(API)) {
          this.exposedAPIs[namespace].push(API);
        }
      }
    }
  }

  // TODO: merge the following 4 functions
  private async _receiveHookRegister(
    callId: string,
    rpcId: string,
    value: any
  ) {
    const { methodName, args, callbackId } = value;

    const actor = this._locals[rpcId];
    if (!actor) {
      throw new Error("Unknown actor " + rpcId);
    }

    this._hookDisposeCallbacks[callbackId] = await actor[methodName](...args);
  }

  private _receiveHookDispose(callId: string, rpcId: string, value: any) {
    const { callbackId } = value;

    const disposeCallback = this._hookDisposeCallbacks[callbackId];
    if (!disposeCallback) {
      return;
    }

    try {
      disposeCallback();
    } catch (e) {
      PLAPI.logService.error(
        `Failed to dispose hook ${callId}`,
        createError(e),
        false,
        "RPC"
      );
    }

    delete this._hookDisposeCallbacks[callbackId];
  }

  private async _receiveCommandRegister(
    callId: string,
    rpcId: string,
    value: any
  ) {
    const { methodName, args, callbackId } = value;

    const actor = this._locals[rpcId];
    if (!actor) {
      throw new Error("Unknown actor " + rpcId);
    }

    this._commandDisposeCallbacks[callbackId] = await actor[methodName](
      ...args
    );
  }

  private _receiveCommandDispose(callId: string, rpcId: string, value: any) {
    const { callbackId } = value;

    const disposeCallback = this._commandDisposeCallbacks[callbackId];
    if (!disposeCallback) {
      return;
    }

    try {
      disposeCallback();
    } catch (e) {
      PLAPI.logService.error(
        `Failed to dispose command ${callId}`,
        createError(e),
        false,
        "RPC"
      );
    }
    delete this._hookDisposeCallbacks[callbackId];
  }
}

function createError(e: any) {
  let error: Error;

  if (e instanceof Error) {
    error = e;
  } else {
    error = new Error((e as any).message || "Unknown error");
    error.name = (e as any).name || "UnknownError";
    error.stack = (e as any).stack || "";
  }

  return error;
}
