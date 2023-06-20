import { Eventable } from "../event";
import { RPCProtocol } from "./rpc-protocol";

interface IRPCServiceState {
  initialized: number;
}

export abstract class RPCService<
  T extends IRPCServiceState
> extends Eventable<T> {
  protected _protocols: { [id: string]: RPCProtocol } = {};

  constructor(eventId: string, initialState: T) {
    super(eventId, initialState);
    this._listenProtocolCreation();
  }

  protected abstract _listenProtocolCreation(): void;
  protected abstract _initActionor(protocol: RPCProtocol): void;
}
