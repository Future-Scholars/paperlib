// Thanks to https://github.dev/microsoft/vscode/
import { MessagePortMain } from "electron";

import { uid } from "@/base/misc";
import { LazyPromise } from "@/base/rpc/lazy-promise";
import { Proxied } from "@/base/rpc/proxied";

export enum MessageType {
  request = 0,
  replySuccess = 1,
  replyError = 2,
  eventListen = 3,
  fireEvent = 4,
  disposeEvent = 5,
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
          !target[name] &&
          name !== "on" &&
          name !== "onChanged" &&
          name !== "onClick"
        ) {
          target[name] = (...myArgs: any[]) => {
            return this._remoteCall(rpcId, name, myArgs);
          };
        } else if (
          typeof name === "string" &&
          (name === "on" || name === "onChanged" || name === "onClick")
        ) {
          target[name] = (...myArgs: any[]) => {
            return this._remoteEventListen(rpcId, myArgs[0], myArgs[1]);
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
      callerId: this._callerId,
      rpcId,
      type: MessageType.request,
      value: {
        methodName,
        args,
      },
    });

    console.log("REMOTE_CALL", msg);

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
      const callbackList = this._eventListeners[remoteEventName]!;
      callbackList[callbackId] = callback;
      remoteEventNameAndCallbackId.push([remoteEventName, callbackId]);

      if (firstTimeRegister) {
        this._port.postMessage(
          JSON.stringify({
            callId,
            callerId: this._callerId,
            rpcId,
            type: MessageType.eventListen,
            value: {
              eventName,
            },
          })
        );

        console.log("REMOTE_EVENT_LISTEN", rpcId, eventName);
      }
    }

    return () => {
      for (const [
        remoteEventName,
        callbackId,
      ] of remoteEventNameAndCallbackId) {
        delete this._eventListeners[remoteEventName]![callbackId];

        this._port.postMessage(
          JSON.stringify({
            callId,
            callerId: this._callerId,
            rpcId,
            type: MessageType.disposeEvent,
          })
        );
      }
    };
  }

  private _receiveOneMessage(rawmsg: string): void {
    const { callId, callerId, rpcId, type, value } = JSON.parse(rawmsg);

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
      case MessageType.fireEvent: {
        this._receiveEventFire(callId, rpcId, value);
        break;
      }
      case MessageType.eventListen: {
        this._receiveEventListen(callId, rpcId, value);
        break;
      }
      case MessageType.disposeEvent: {
        this._receiveEventDispose(callId);
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

  protected _doInvokeHandler(
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
    if (this._callWithCallerId) {
      return method.apply(actor, [this._callerId, ...args]);
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

    pendingReply.reject(value);
  }

  private _receiveEventListen(callId: string, rpcId: string, value: any): void {
    const { eventName } = value;

    const actor = this._locals[rpcId];
    if (!actor) {
      throw new Error("Unknown actor " + rpcId);
    }

    this._eventDisposeCallbacks[callId] = actor.on(
      eventName,
      (...args: any[]) => {
        const msg = JSON.stringify({
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
      }
    );
  }

  private _receiveEventDispose(callId: string): void {
    const disposeCallback = this._eventDisposeCallbacks[callId];
    if (!disposeCallback) {
      return;
    }

    disposeCallback();
    delete this._eventDisposeCallbacks[callId];
  }

  private _receiveEventFire(callId: string, rpcId: string, value: any): void {
    const { eventName, args } = value;

    const remoteEventName = `${rpcId}.${eventName}`;

    console.log("REMOTE_EVENT_FIRE", remoteEventName, args);

    const callbackList = this._eventListeners[remoteEventName];
    if (!callbackList) {
      return;
    }

    for (const callbackId in callbackList) {
      callbackList[callbackId](args);
    }
  }
}
