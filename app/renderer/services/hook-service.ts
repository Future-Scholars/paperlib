import { createDecorator } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { PaperEntity } from "@/models/paper-entity";
import { ILogService, LogService } from "@/renderer/services/log-service";

export const IHookService = createDecorator("hookService");

/**
 * HookService is a service inject some hook points in the Paperlib app. Extensions can use these hook points to extend the functionality of Paperlib.
 *
 */
export class HookService {
  private readonly _modifyHookPoints: {
    [key: string]: {
      [key: string]: (...args: any[]) => Promise<any>;
    };
  };

  private readonly _transformHookPoints: {
    [key: string]: {
      [key: string]: (...args: any[]) => Promise<any>;
    };
  };

  constructor(@ILogService private readonly _logService: LogService) {
    this._modifyHookPoints = {};
    this._transformHookPoints = {};
  }

  hasHook(hookName: string) {
    if (this._modifyHookPoints[hookName]) {
      return "modify";
    } else if (this._transformHookPoints[hookName]) {
      return "transform";
    } else {
      return false;
    }
  }

  async modifyHookPoint<T extends any[]>(hookName: string, ...args: T) {
    if (this._modifyHookPoints[hookName]) {
      const extensionAPIExposed = await rendererRPCService.waitForAPI(
        Process.extension,
        "PLExtAPI",
        5000
      );

      if (!extensionAPIExposed) {
        return args;
      }

      let processedArgs = args;
      for (const [hookID, runHook] of Object.entries(
        this._modifyHookPoints[hookName]
      )) {
        // processedArgs = await runHook(processedArgs);
        // Set maximum wait time for each hooker.
        processedArgs = await Promise.race([
          runHook(processedArgs),
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(processedArgs);
            }, 5000);
          }),
        ]);

        processedArgs = this.recoverClass(args, processedArgs);
      }

      return processedArgs;
    } else {
      return args;
    }
  }

  async transformhookPoint<T extends any[], O extends any[]>(
    hookName: string,
    ...args: T
  ) {
    if (this._transformHookPoints[hookName]) {
      const extensionAPIExposed = await rendererRPCService.waitForAPI(
        Process.extension,
        "PLExtAPI",
        5000
      );

      if (!extensionAPIExposed) {
        return args;
      }

      const results: O = [] as any;

      for (const [hookID, runHook] of Object.entries(
        this._transformHookPoints[hookName]
      )) {
        // const result = await runHook(args);
        // Set maximum wait time for each hooker.
        const result = await Promise.race([
          runHook(args),
          new Promise((resolve) => {
            setTimeout(() => {
              resolve([]);
            }, 16000);
          }),
        ]);

        results.push(result);
      }

      return results.flat();
    } else {
      return args;
    }
  }

  hookModify(hookName: string, extensionID: string, callbackName: string) {
    this._logService.info(
      `Hooking ${hookName} of extension ${extensionID}-${callbackName}`,
      "Modify Hook",
      false,
      "HookService"
    );

    if (!this._modifyHookPoints[hookName]) {
      this._modifyHookPoints[hookName] = {};
    }

    const runHook = async (args: any[]) => {
      try {
        const extensionAPIExposed = await rendererRPCService.waitForAPI(
          Process.extension,
          "PLExtAPI",
          5000
        );

        if (!extensionAPIExposed) {
          return args;
        }

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

    this._modifyHookPoints[hookName][`${extensionID}-${callbackName}`] =
      runHook;

    return () => {
      this._logService.info(
        `Disposing modify hook ${hookName}.`,
        `Extension ${extensionID}-${callbackName}`,
        false,
        "HookService"
      );
      delete this._modifyHookPoints[hookName][`${extensionID}-${callbackName}`];
    };
  }

  hookTransform(hookName: string, extensionID: string, callbackName: string) {
    this._logService.info(
      `Hooking ${hookName} of extension ${extensionID}-${callbackName}`,
      "Transform Hook",
      false,
      "HookService"
    );

    if (!this._transformHookPoints[hookName]) {
      this._transformHookPoints[hookName] = {};
    }

    const runHook = async (args: any[]) => {
      try {
        const extensionAPIExposed = await rendererRPCService.waitForAPI(
          Process.extension,
          "PLExtAPI",
          5000
        );

        if (!extensionAPIExposed) {
          return;
        }

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
        return;
      }
    };

    this._transformHookPoints[hookName][`${extensionID}-${callbackName}`] =
      runHook;

    return () => {
      this._logService.info(
        `Disposing transform hook ${hookName}.`,
        `Extension ${extensionID}-${callbackName}`,
        false,
        "HookService"
      );
      delete this._transformHookPoints[hookName][
        `${extensionID}-${callbackName}`
      ];
    };
  }

  recoverClass<T>(originalObj: T, obj: any): T {
    if (originalObj instanceof PaperEntity) {
      return new PaperEntity(obj, false) as T;
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
