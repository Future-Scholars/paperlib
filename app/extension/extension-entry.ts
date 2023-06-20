import { ExtensionRPCService } from "@/base/rpc/extension-rpc-service";

const extensionRPCService = new ExtensionRPCService();

extensionRPCService.on("initialized", async () => {
  try {
    console.log(await paperlibAPI.appService.version());
  } catch (e) {
    console.log("error");
  }
});
