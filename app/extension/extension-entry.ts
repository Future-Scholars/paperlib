import { IInjectable } from "@/extension/services/injectable";
import { InjectionContainer } from "@/base/injection/injection";
import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";

const injectionContainer = new InjectionContainer();

const instances = injectionContainer.createInstance<IInjectable>({
  extensionRPCService: ExtensionRPCService,
  extensionManagementService: ExtensionManagementService,
});
for (const [key, instance] of Object.entries(instances)) {
  globalThis[key] = instance;
}

extensionRPCService.on("initialized", async (protocolId) => {
  try {
    console.log(`extension process initialized: ${protocolId.value}`);

    if (protocolId.value === "rendererProcess") {
      extensionManagementService.installInnerPlugins();
    }
  } catch (e) {
    console.log(e);
  }
});
