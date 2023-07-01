import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";

const extensionRPCService = new ExtensionRPCService();

extensionRPCService.on("initialized", async () => {
  try {
    console.log(await PLAPI.appService.version());
  } catch (e) {
    console.log("error");
  }
});
