import { Eventable } from "../event";
import { EIMainRPCProtocol } from "./ei-main-rpc-protocol";
import { EIRendererRPCProtocol } from "./ei-renderer-rpc-protocol";
import { MessagePortRPCProtocol } from "./messageport-rpc-protocol";

interface IRPCServiceState {
  initialized: string;
}

export type RPCProtocol =
  | MessagePortRPCProtocol
  | EIMainRPCProtocol
  | EIRendererRPCProtocol;

export abstract class RPCService<
  T extends IRPCServiceState
> extends Eventable<T> {
  protected abstract _apiNamespace: string;
  protected _protocols: { [id: string]: RPCProtocol } = {};
  protected _actionors: { [id: string]: { [key: string]: any } } = {};

  constructor(eventId: string, initialState: T) {
    super(eventId, initialState);
  }

  setActionor(actionors: { [key: string]: any }): void {
    this._actionors = actionors;
  }

  protected abstract listenProtocolCreation(): void;

  initActionor(protocol: RPCProtocol): void {
    for (const [key, value] of Object.entries(this._actionors)) {
      protocol.set(key, value);
    }
  }

  exposedAPI(): { [namespace: string]: string[] } {
    const exposedAPI: { [namespace: string]: string[] } = {};
    exposedAPI[this._apiNamespace] = Object.keys(this._actionors);
    return exposedAPI;
  }

  abstract initProxy(
    protocol: RPCProtocol,
    exposedAPI: { [namespace: string]: string[] }
  ): void;
}
