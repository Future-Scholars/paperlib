import { Eventable } from "../event";
import { MessagePortRPCProtocol } from "./messageport-rpc-protocol";

interface IRPCServiceState {
  initialized: string;
}

export type RPCProtocol = MessagePortRPCProtocol;

export abstract class RPCService<
  T extends IRPCServiceState
> extends Eventable<T> {
  protected _protocols: { [id: string]: RPCProtocol } = {};
  protected _remoteAPIs: { [id: string]: { [key: string]: any } } = {};
  protected _actionors: { [id: string]: { [key: string]: any } } = {};

  constructor(eventId: string, initialState: T) {
    super(eventId, initialState);
  }

  async waitForAPI(
    processID: string,
    namespace: string,
    timeout: number
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      for (let i = 0; i < timeout / 100; i++) {
        if (
          this._protocols[processID] &&
          this._protocols[processID].exposedAPIs[namespace] &&
          this._protocols[processID].exposedAPIs[namespace].length > 0
        ) {
          resolve(true);
          break;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (
        this._protocols[processID] &&
        this._protocols[processID].exposedAPIs[namespace] &&
        this._protocols[processID].exposedAPIs[namespace].length > 0
      ) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  setActionor(actionors: { [key: string]: any }): void {
    this._actionors = actionors;
  }

  initActionor(protocol: RPCProtocol): void {
    for (const [key, value] of Object.entries(this._actionors)) {
      protocol.set(key, value);
    }
  }
}
