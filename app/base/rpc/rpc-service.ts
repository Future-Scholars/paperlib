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
  protected _protocols: { [id: string]: RPCProtocol } = {};

  constructor(eventId: string, initialState: T) {
    super(eventId, initialState);
  }

  protected abstract _listenProtocolCreation(): void;
  abstract initActionor(protocol: RPCProtocol): void;
  abstract initProxy(protocol: RPCProtocol, protocolId: string): void;
}
