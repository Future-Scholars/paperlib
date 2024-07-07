import { Proxied } from "@/base/rpc/proxied";
import { LogService } from "@/common/services/log-service";

interface PLAPIShape {
  logService: Proxied<LogService>;
}

declare global {
  var PLAPI: PLAPIShape;
}