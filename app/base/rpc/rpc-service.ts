import { MessagePortRPCProtocol } from "./messageport-rpc-protocol";

export type RPCProtocol = MessagePortRPCProtocol;

export abstract class RPCService {
  protected _protocols: { [id: string]: RPCProtocol } = {};
  protected _remoteAPIs: { [id: string]: { [key: string]: any } } = {};
  protected _actionors: { [id: string]: { [key: string]: any } } = {};

  constructor(
    protected readonly _processID: string,
    protected readonly _exposeAPIGroup?: string
  ) {}

  async waitForAPI(
    processID: string,
    group: string,
    timeout: number
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      for (let i = 0; i < timeout / 100; i++) {
        if (
          this._protocols[processID] &&
          this._protocols[processID].exposedAPIs[group] &&
          this._protocols[processID].exposedAPIs[group].length > 0
        ) {
          resolve(true);
          break;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (
        this._protocols[processID] &&
        this._protocols[processID].exposedAPIs[group] &&
        this._protocols[processID].exposedAPIs[group].length > 0
      ) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  setActionor(actionors: { [key: string]: any }): void {
    this._actionors = actionors;

    for (const [_processID, protocol] of Object.entries(this._protocols)) {
      this.initActionor(protocol);
      if (this._exposeAPIGroup) {
        protocol.sendExposedAPI(this._exposeAPIGroup);
      }
    }
  }

  initActionor(protocol: RPCProtocol): void {
    for (const [key, value] of Object.entries(this._actionors)) {
      protocol.set(key, value);
    }
  }

  abstract initCommunication(processId?: string): Promise<void>;
}
