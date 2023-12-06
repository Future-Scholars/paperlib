import { createDecorator } from "@/base/injection/injection";
import { PaperEntity } from "@/models/paper-entity";
import { ILogService, LogService } from "@/renderer/services/log-service";

export const IHookService = createDecorator("hookService");

/**
 * HookService is a service inject some hook points in the Paperlib app. Extensions can use these hook points to extend the functionality of Paperlib.
 *
 */
export class HookService {
  private readonly _hookPoints: { [key: string]: any };
  constructor(@ILogService private readonly _logService: LogService) {
    this._hookPoints = {};
  }

  hasHook(hookName: string) {
    return !!this._hookPoints[hookName];
  }

  async hookPoint<T extends any[]>(hookName: string, ...args: T) {
    if (this._hookPoints[hookName]) {
      const extensionAPIExposed = await rendererRPCService.waitForAPI(
        "extensionProcess",
        "PLExtAPI",
        5000
      );

      if (!extensionAPIExposed) {
        return args;
      }

      let processedArgs = args;
      for (const runHook of this._hookPoints[hookName]) {
        processedArgs = await runHook(processedArgs);
        processedArgs = this.recoverClass(args, processedArgs);
      }

      return processedArgs;
    } else {
      return args;
    }
  }

  async hook(hookName: string, extensionID: string, callbackName: string) {
    const extensionAPIExposed = await rendererRPCService.waitForAPI(
      "extensionProcess",
      "PLExtAPI",
      5000
    );

    if (!extensionAPIExposed) {
      return;
    }

    if (!this._hookPoints[hookName]) {
      this._hookPoints[hookName] = [];
    }

    // TODO: if hook error, the processing spin should be stopped
    const runHook = async (args: any[]) => {
      try {
        return await PLExtAPI.extensionManagementService.callExtensionMethod(
          extensionID,
          callbackName,
          ...args
        );
      } catch (e) {
        this._logService.error(
          `Failed to call extension method ${callbackName} of extension ${extensionID},
        e as Error,
        true,
        "HookService"`
        );
        return args;
      }
    };

    this._hookPoints[hookName].push(runHook);

    //TODO: Dispose callback
  }

  recoverClass<T>(originalObj: T, obj: any): T {
    // console.log("recoverClass", originalObj, obj);

    if (originalObj instanceof PaperEntity) {
      return new PaperEntity().initialize(obj) as T;
    } else if (originalObj instanceof Array) {
      if (obj instanceof Array) {
        return obj.map((o, i) => this.recoverClass(originalObj[i], o)) as any;
      } else {
        this._logService.warn(
          `Failed to recover class of ${typeof originalObj} with ${typeof obj}`,
          "",
          true,
          "HookService"
        );

        return originalObj;
      }
    } else if (originalObj instanceof Object) {
      if (obj instanceof Object) {
        for (const key in originalObj) {
          obj[key] = this.recoverClass(originalObj[key], obj[key]);
        }
        return obj;
      } else {
        this._logService.warn(
          `Failed to recover class of ${typeof originalObj} with ${typeof obj}`,
          "",
          true,
          "HookService"
        );

        return originalObj;
      }
    } else {
      return originalObj;
    }
  }
}
