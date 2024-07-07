import { isEqual } from "lodash";
import {
  createPinia,
  defineStore,
  getActivePinia,
  setActivePinia,
} from "pinia";

import { uid } from "@/base/misc";
import { MessagePortRPCProtocol } from "./messageport-rpc-protocol";

/**
 * MessagePort based RPC Protocol in the Renderer Process with pinia support */
export class RendererProcessMessagePortRPCProtocol extends MessagePortRPCProtocol {
  protected _bindPiniaStates: Map<string, any>;
  private readonly _piniaGroupId: string;

  constructor(
    port: MessagePort,
    callerId: string,
    callWithCallerId: boolean = false
  ) {
    super(port, callerId, callWithCallerId);

    if (!getActivePinia()) {
      setActivePinia(createPinia());
    }

    this._bindPiniaStates = new Map();
    this._piniaGroupId = uid();
  }

  protected _createProxy<T>(rpcId: string): T {
    const handler = {
      get: (target: any, name: PropertyKey) => {
        if (
          typeof name === "string" &&
          // TODO: Check: once
          (name === "on" ||
            name === "onChanged" ||
            name === "onClick" ||
            name === "once")
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
        } else if (typeof name === "string" && name === "useState") {
          target[name] = () => {
            return this._useState(rpcId);
          };
        } else if (typeof name === "string" && name === "bindState") {
          target[name] = () => {
            return this._bindState(rpcId);
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

  private _useState(rpcId: string) {
    if (this._bindPiniaStates.has(rpcId)) {
      return this._bindPiniaStates.get(rpcId).state;
    } else {
      return null;
    }
  }

  private async _bindState(rpcId: string) {
    const defaultState = await this._remoteCall(rpcId, "useState", []);

    const piniaStore = defineStore(`${this._piniaGroupId}- ${rpcId}-store`, {
      state: () => {
        return JSON.parse(JSON.stringify(defaultState));
      },
    })();

    piniaStore.$patchupdate = (patch: any, direct = false) => {
      const realPatch: any = {};
      for (const key in patch) {
        if (isEqual(patch[key], piniaStore[key])) {
          continue;
        } else {
          realPatch[key] = patch[key];
        }
      }

      if (Object.keys(realPatch).length > 0) {
        piniaStore.$patch(realPatch);

        if (direct) {
          this._remoteCall(rpcId, "setState", [realPatch]);
        }
      }
    };

    const stateKeys = Object.keys(defaultState);

    const disposeCallback = this._remoteEventListen(
      rpcId,
      stateKeys,
      (newValue: { key: string; value: any }) => {
        piniaStore.$patchupdate({ [newValue.key]: newValue.value });
      }
    );

    const piniaStoreProxy = new Proxy(piniaStore, {
      get: (target, prop) => {
        return target[prop as any];
      },
      set: (target, prop, value) => {
        target.$patchupdate({ [prop]: value }, true);
        return true;
      },
    });

    this._bindPiniaStates.set(rpcId, {
      state: piniaStoreProxy,
      disposeCallback,
    });
  }
}
