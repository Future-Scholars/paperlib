import { Proxied } from "@/base/rpc/rpc-protocol";
import { APPService } from "@/renderer/services/app-service";

export interface APIShape {
  appService: Proxied<APPService>;
}
