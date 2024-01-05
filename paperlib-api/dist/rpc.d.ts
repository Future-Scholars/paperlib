import { MessagePortMain } from 'electron';
import { Store } from 'pinia';

/**
 * A eventable base class.
 * There is two ways to fire a event:
 *   1. Fire a single event by calling `fire(event: string)` / Fire multiple events by calling `fire(events: { [key in keyof T]?: any })`
 *   2. Directly modify the state by calling `useState().key = value`
 */
declare class Eventable<T extends IEventState> implements IDisposable {
    private readonly _useStateFunc;
    protected readonly _state: Store<string, T>;
    private _stateProxy?;
    protected readonly _listeners: Partial<Record<keyof T, {
        [callbackId: string]: (value: any) => void;
    }>>;
    protected readonly _eventGroupId: string;
    protected readonly _eventDefaultState: T;
    constructor(eventGroupId: string, eventDefaultState?: T);
    useState(proxied?: boolean): Store<string, T>;
    getState(key: keyof T): any;
    /**
     * Fire an event
     * @param event - event name or object of events
     * @returns
     */
    fire(event: {
        [key in keyof T]?: any;
    } | keyof T, onlyIfChanged?: boolean): void;
    /**
     * Add a listener
     * @param key - key(s) of the event
     * @param callback - callback function
     * @returns
     */
    onChanged(key: keyof T | (keyof T)[], callback: (newValues: {
        key: keyof T;
        value: any;
    }) => void): () => void;
    /**
     * Add a listener
     * @param key - key(s) of the event
     * @param callback - callback function
     * @returns
     */
    on: (key: keyof T | (keyof T)[], callback: (newValues: {
        key: keyof T;
        value: any;
    }) => void) => () => void;
    already(key: keyof T | (keyof T)[], callback: (newValues: {
        key: keyof T;
        value: any;
    }) => void): () => void;
    dispose(): void;
}

declare interface IDisposable {
    dispose: () => void;
}

declare interface IEventState {
    [key: string]: any;
}

declare interface IRendererRPCServiceState {
    initialized: string;
}

declare interface IRPCServiceState {
    initialized: string;
}

/**
 * MessagePort based RPC Protocol*/
declare class MessagePortRPCProtocol {
    private readonly _port;
    private readonly _proxies;
    private readonly _locals;
    private _lastCallId;
    private readonly _pendingRPCReplies;
    private readonly _callerId;
    private readonly _callWithCallerId;
    private readonly _eventListeners;
    private readonly _eventDisposeCallbacks;
    private readonly _hookDisposeCallbacks;
    private readonly _commandDisposeCallbacks;
    exposedAPIs: {
        [namespace: string]: string[];
    };
    constructor(port: MessagePortMain | MessagePort, callerId: string, callWithCallerId?: boolean);
    set<T>(rpcId: string, value: T): void;
    getProxy<T>(rpcId: string): Proxied<T>;
    private _createProxy;
    private _remoteCall;
    private _remoteEventListen;
    private _remoteHookRegister;
    private _remoteCommandRegister;
    private _receiveOneMessage;
    private _receiveRequest;
    private _invokeHandler;
    protected _doInvokeHandler(rpcId: string, callerId: string, methodName: string, args: any[]): any;
    private _receiveReply;
    private _receiveError;
    private _receiveEventListen;
    private _receiveEventDispose;
    private _receiveEventFire;
    sendExposedAPI(namespace: string): void;
    private _receiveExposedAPI;
    private _receiveHookRegister;
    private _receiveHookDispose;
    private _receiveCommandRegister;
    private _receiveCommandDispose;
}

declare type Proxied<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => infer R ? K extends "on" | "once" | "already" | "onChanged" | "onClick" | "hookTransform" | "hookModify" | "registerExternel" ? (...args: A) => () => void : (...args: {
        [K in keyof A]: A[K];
    }) => Promise<Awaited<R>> : never;
};

export declare class RendererRPCService extends RPCService<IRendererRPCServiceState> {
    private readonly _processID;
    private readonly _exposeAPIGroup?;
    constructor(_processID: string, _exposeAPIGroup?: string | undefined);
    initCommunication(): Promise<void>;
    waitForAPI(processID: string, namespace: string, timeout: number): Promise<boolean>;
    setActionor(actionors: {
        [key: string]: any;
    }): void;
}

declare type RPCProtocol = MessagePortRPCProtocol;

declare abstract class RPCService<T extends IRPCServiceState> extends Eventable<T> {
    protected _protocols: {
        [id: string]: RPCProtocol;
    };
    protected _remoteAPIs: {
        [id: string]: {
            [key: string]: any;
        };
    };
    protected _actionors: {
        [id: string]: {
            [key: string]: any;
        };
    };
    constructor(eventId: string, initialState: T);
    setActionor(actionors: {
        [key: string]: any;
    }): void;
    initActionor(protocol: RPCProtocol): void;
}

export { }
