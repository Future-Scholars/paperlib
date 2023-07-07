import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";

const extensionRPCService = new ExtensionRPCService();

extensionRPCService.on("initialized", async (protocolId) => {
  try {
    console.log(`extension process initialized: ${protocolId.value}`);
  } catch (e) {
    console.log("error");
  }
});
