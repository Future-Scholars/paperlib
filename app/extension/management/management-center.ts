import { PluginManager } from "live-plugin-manager";

export class ManagementCenter {
  private extManager: PluginManager;

  constructor() {
    this.extManager = new PluginManager();
  }

  async installExtension(pluginName: string) {
    try {
      await this.extManager.install(pluginName);
    } catch (e) {}
  }

  async uninstallExtension(pluginName: string) {
    await this.extManager.uninstall(pluginName);
  }
}
