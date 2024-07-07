import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";
import { clipboard } from "electron";

export const ISystemService = createDecorator("systemService");

export class SystemService {
  constructor() {}

  /**
   * Write the given value to the clipboard.
   * @param {string} value - The value to write to the clipboard.
   */
  @errorcatching("Failed to write clipboard.", true, "SystemService")
  writeClipboard(value: string) {
    clipboard.writeText(value);
  }
}
