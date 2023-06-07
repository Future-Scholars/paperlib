import { Proxied, RPCProtocol } from "../rpc/rpc-protocol";
import { AppInteractorShape } from "./proxies/app";

// API client in any process
export class APIClient {
  public app: Proxied<AppInteractorShape>;

  constructor(protocol: RPCProtocol) {
    this.app = protocol.getProxy<AppInteractorShape>("app");
  }
}
