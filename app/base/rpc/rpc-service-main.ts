import { MessageChannelMain, UtilityProcess } from "electron";
import { Graph } from "graph-data-structure";

import { ProcessStorage } from "@/base/process-storage";
import { WindowStorage } from "@/base/window-storage";

import { MessagePortRPCProtocol } from "./messageport-rpc-protocol";
import { RPCService } from "./rpc-service";

interface IGraph {
  addNode(id: string): void;
  addEdge(id1: string, id2: string): void;
  topologicalSort(): string[];
  hasCycle(): boolean;
  nodes(): string[];
  hasEdge(id1: string, id2: string): boolean;
  removeNode(id: string): IGraph;
}

export class MainProcessRPCService extends RPCService {
  private readonly _processGraph: IGraph;

  constructor(
    protected readonly _processID: string,
    protected readonly _exposeAPIGroup?: string
  ) {
    super(_processID, _exposeAPIGroup);

    if (process.type !== "browser") {
      throw new Error(
        "MainProcessRPCService should only be instantiated in the main process"
      );
    }

    this._processGraph = Graph();
  }

  // ============================================================
  // - For the main process rpc service
  // 1. Here is a bridge for all processes to exchange port for communication.
  //    All other processes will try to send a request to here.
  // 2. Once receiving a request, we loop through all registered processes.
  //    If there is no channel between the requester and the registered process,
  //    we will create a new MessagePort pair first. If the registered process is the main process,
  //    we will create a new MessagePortProtocol for communication. Otherwise, we will transfer the
  //    MessagePort to the registered process.
  // 3. All actionors in the current process will be binded with this protocol immediately.
  // 4. After the protocol is created, we will send a message through the protocol to broadcast the exposed APIs of the current process.
  // ============================================================
  async initCommunication(
    senderID: string,
    windows?: WindowStorage,
    processes?: ProcessStorage
  ): Promise<void> {
    const processIDs = this._processGraph.nodes();

    for (const processID of processIDs) {
      if (processID === senderID) {
        continue;
      }

      if (!this._processGraph.hasEdge(processID, senderID)) {
        if (processID === this._processID) {
          const { port1: portForMain, port2: portForRequester } =
            new MessageChannelMain();

          const protocol = new MessagePortRPCProtocol(
            portForMain,
            this._processID,
            false
          );
          this._protocols[senderID] = protocol;
          this.initActionor(protocol);

          this._exposeAPIGroup && protocol.sendExposedAPI(this._exposeAPIGroup);

          if (windows?.has(senderID)) {
            windows
              .get(senderID)
              .webContents.postMessage(
                "forward-response-port",
                this._processID,
                [portForRequester]
              );
          }

          if (processes?.has(senderID)) {
            processes
              .get(senderID)
              .postMessage({ type: "response-port", value: this._processID }, [
                portForRequester,
              ]);
          }

          this._processGraph.addEdge(processID, senderID);
        } else {
          const { port1: portForTheir, port2: portForRequester } =
            new MessageChannelMain();
          // Send the port to the requester
          if (windows?.has(senderID)) {
            windows
              .get(senderID)
              .webContents.postMessage("forward-response-port", processID, [
                portForRequester,
              ]);
          }
          if (processes?.has(senderID)) {
            processes
              .get(senderID)
              .postMessage({ type: "response-port", value: processID }, [
                portForRequester,
              ]);
          }
          // Send the port to the registered process
          if (windows?.has(processID)) {
            windows
              .get(processID)
              .webContents.postMessage("forward-response-port", senderID, [
                portForTheir,
              ]);
          }
          if (processes?.has(processID)) {
            processes
              .get(processID)
              .postMessage({ type: "response-port", value: senderID }, [
                portForTheir,
              ]);
          }
          this._processGraph.addEdge(processID, senderID);
        }
      }
    }
  }

  async stopCommunication(
    destroyedProcessID: string,
    windows?: WindowStorage,
    processes?: {
      get: (id: string) => UtilityProcess;
      has: (id: string) => boolean;
    }
  ): Promise<void> {
    for (const otherProcessID of this._processGraph.nodes()) {
      if (otherProcessID === destroyedProcessID) {
        continue;
      }

      if (this._processGraph.hasEdge(otherProcessID, destroyedProcessID)) {
        if (processes?.has[otherProcessID]) {
          processes.get(otherProcessID).postMessage({
            type: "destroy-port",
            value: destroyedProcessID,
          });
        }

        if (windows?.has(otherProcessID)) {
          windows
            .get(otherProcessID)
            .webContents.postMessage("destroy-port", destroyedProcessID);
        }
      }
    }

    this._processGraph.removeNode(destroyedProcessID);
  }

  setActionor(actionors: { [key: string]: any }): void {
    this._processGraph.addNode(this._processID);
    super.setActionor(actionors);
  }
}
