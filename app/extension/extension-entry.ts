import { APIClient } from "../api/api";
import { RPCProtocol } from "../rpc/rpc-protocol";

process.parentPort.once("message", (e) => {
  const [port] = e.ports;

  const apiClient = new APIClient(new RPCProtocol(port));

  globalThis.paperlibAPI = apiClient;

  paperlibAPI.app.version().then((version) => {
    console.log(`Paperlib version ${version}`);
  });
});
