import { MessageChannelMain } from "electron";
import { Graph } from "graph-data-structure";

import { createDecorator } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { RPCService } from "@/base/rpc/rpc-service";
import { WindowProcessManagementService } from "@/main/services/window-process-management-service";

import { ExtensionProcessManagementService } from "./extension-process-management-service";

interface IMainRPCServiceState {
  initialized: string;
}

export const IMainRPCService = createDecorator("mainRPCService");

interface IGraph {
  addNode(id: string): void;
  addEdge(id1: string, id2: string): void;
  topologicalSort(): string[];
  hasCycle(): boolean;
  nodes(): string[];
  hasEdge(id1: string, id2: string): boolean;
  removeNode(id: string): IGraph;
}

export class MainRPCService extends RPCService<IMainRPCServiceState> {
  private _registeredAPIs: {
    [processIdNamespace: string]: string[];
  } = {};
  private readonly _processGraph: IGraph;

  constructor() {
    super("mainRPCService", { initialized: "" });

    if (process.type !== "browser") {
      throw new Error(
        "MainRPCService should only be instantiated in the main process"
      );
    }

    this._processGraph = Graph();
    this._processGraph.addNode(Process.main);
  }

  async initCommunication(
    windowProcessManagementService: WindowProcessManagementService,
    extensionProcessManagementService: ExtensionProcessManagementService
  ): Promise<void> {
    // 1. Here is a bridge for all processes to exchange port for communication.
    //    All other processes will try to send a request to here.
    // 2. Once receiving a request, we loop through all registered processes.
    //    If there is no channel between the requester and the registered process,
    //    we will create a new MessagePort pair first. If the registered process is the main process,
    //    we will create a new MessagePortProtocol for communication. Otherwise, we will transfer the
    //    MessagePort to the registered process.
    // 3. All actionors in the current process will be binded with this protocol immediately.
    // 4. After the protocol is created, we will send a message through the protocol to broadcast the exposed APIs of the current process.

    windowProcessManagementService.on(
      "destroyed",
      (payload: { value: string }) => {
        const destroyedProcessID = payload.value;

        for (const otherProcessID of this._processGraph.nodes()) {
          if (otherProcessID === destroyedProcessID) {
            continue;
          }

          if (this._processGraph.hasEdge(otherProcessID, destroyedProcessID)) {
            if (
              windowProcessManagementService.browserWindows.has(otherProcessID)
            ) {
              windowProcessManagementService.browserWindows
                .get(otherProcessID)
                .webContents.postMessage("destroy-port", destroyedProcessID);
            }

            if (
              extensionProcessManagementService.extensionProcesses[otherProcessID]
            ) {
              extensionProcessManagementService.extensionProcesses[
                otherProcessID
              ].postMessage({ type: "destroy-port", value: destroyedProcessID });
            }
          }
        }

        this._processGraph.removeNode(destroyedProcessID);
      }
    );

    windowProcessManagementService.on(
      "requestPort",
      (payload: { value: string }) => {
        const senderID = payload.value;
        const processIDs = this._processGraph.nodes();

        for (const processID of processIDs) {
          if (processID === senderID) {
            continue;
          }

          if (!this._processGraph.hasEdge(processID, senderID)) {
            if (processID === Process.main) {
              const { port1: portForMain, port2: portForRequester } =
                new MessageChannelMain();

              const protocol = new MessagePortRPCProtocol(
                portForMain,
                Process.main,
                false
              );
              this._protocols[senderID] = protocol;
              this.initActionor(protocol);

              protocol.sendExposedAPI("PLMainAPI");

              if (windowProcessManagementService.browserWindows.has(senderID)) {
                windowProcessManagementService.browserWindows
                  .get(senderID)
                  .webContents.postMessage("response-port", Process.main, [
                    portForRequester,
                  ]);
              }
              this._processGraph.addEdge(processID, senderID);
            } else {
              const { port1: portForTheir, port2: portForRequester } =
                new MessageChannelMain();
              // Send the port to the requester
              if (windowProcessManagementService.browserWindows.has(senderID)) {
                windowProcessManagementService.browserWindows
                  .get(senderID)
                  .webContents.postMessage("response-port", processID, [
                    portForRequester,
                  ]);
              }
              if (
                windowProcessManagementService.browserWindows.has(processID)
              ) {
                windowProcessManagementService.browserWindows
                  .get(processID)
                  .webContents.postMessage("response-port", senderID, [
                    portForTheir,
                  ]);
              }
              if (
                extensionProcessManagementService.extensionProcesses[processID]
              ) {
                extensionProcessManagementService.extensionProcesses[
                  processID
                ].postMessage({ type: "response-port", value: senderID }, [
                  portForTheir,
                ]);
              }
              this._processGraph.addEdge(processID, senderID);
            }
          }
        }
      }
    );

    extensionProcessManagementService.on(
      "destroyed",
      (payload: { value: string }) => {
        const destroyedProcessID = payload.value;

        for (const otherProcessID of this._processGraph.nodes()) {
          if (otherProcessID === destroyedProcessID) {
            continue;
          }

          if (this._processGraph.hasEdge(otherProcessID, destroyedProcessID)) {
            if (
              extensionProcessManagementService.extensionProcesses[
                otherProcessID
              ]
            ) {
              extensionProcessManagementService.extensionProcesses[
                otherProcessID
              ].postMessage({
                type: "destroy-port",
                value: destroyedProcessID,
              });
            }
          }
        }

        this._processGraph.removeNode(destroyedProcessID);
      }
    );

    extensionProcessManagementService.on(
      "requestPort",
      (payload: { key: string; value: string }) => {
        const senderID = payload.value;
        const processIDs = this._processGraph.nodes();

        for (const processID of processIDs) {
          if (processID === senderID) {
            continue;
          }

          if (!this._processGraph.hasEdge(processID, senderID)) {
            if (processID === Process.main) {
              const { port1: portForMain, port2: portForRequester } =
                new MessageChannelMain();

              const protocol = new MessagePortRPCProtocol(
                portForMain,
                Process.main,
                false
              );
              this._protocols[senderID] = protocol;
              this.initActionor(protocol);

              protocol.sendExposedAPI("PLMainAPI");

              if (windowProcessManagementService.browserWindows.has(senderID)) {
                windowProcessManagementService.browserWindows
                  .get(senderID)
                  .webContents.postMessage("response-port", Process.main, [
                    portForRequester,
                  ]);
              }

              if (
                extensionProcessManagementService.extensionProcesses[senderID]
              ) {
                extensionProcessManagementService.extensionProcesses[
                  senderID
                ].postMessage({ type: "response-port", value: Process.main }, [
                  portForRequester,
                ]);
              }
              this._processGraph.addEdge(processID, senderID);
            } else {
              const { port1: portForTheir, port2: portForRequester } =
                new MessageChannelMain();
              // Send the port to the requester
              if (windowProcessManagementService.browserWindows.has(senderID)) {
                windowProcessManagementService.browserWindows
                  .get(senderID)
                  .webContents.postMessage("response-port", processID, [
                    portForRequester,
                  ]);
              }
              if (
                extensionProcessManagementService.extensionProcesses[senderID]
              ) {
                extensionProcessManagementService.extensionProcesses[
                  senderID
                ].postMessage({ type: "response-port", value: processID }, [
                  portForRequester,
                ]);
              }
              if (
                windowProcessManagementService.browserWindows.has(processID)
              ) {
                windowProcessManagementService.browserWindows
                  .get(processID)
                  .webContents.postMessage("response-port", senderID, [
                    portForTheir,
                  ]);
              }
              if (
                extensionProcessManagementService.extensionProcesses[processID]
              ) {
                extensionProcessManagementService.extensionProcesses[
                  processID
                ].postMessage({ type: "response-port", value: senderID }, [
                  portForTheir,
                ]);
              }
              this._processGraph.addEdge(processID, senderID);
            }
          }
        }
      }
    );
  }

  setActionor(actionors: { [key: string]: any }): void {
    this._actionors = actionors;
    this._registeredAPIs[`${Process.main}-PLMainAPI`] = [
      "windowProcessManagementService",
      "fileSystemService",
      "contextMenuService",
      "upgradeService",
      "menuService",
      "proxyService",
    ];
  }
}
