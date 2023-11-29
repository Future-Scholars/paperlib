declare module "paperlib" {
  export namespace PLAPI {
    export var appService: {
      version(): Promise<string>;
    }

    export var logService: {
      log(
        level: "info" | "warn" | "error",
        msg: string,
        additional: string = "",
        notify: boolean = false,
        id?: string
      ): void;

      info(
        msg: string,
        additional: string = "",
        notify: boolean = false,
        id?: string
      ): void;

      warn(
        msg: string,
        additional: string = "",
        notify: boolean = false,
        id?: string
      ): void;

      error(
        msg: string,
        additional: string | Error = "",
        notify: boolean = false,
        id?: string
      ): void;

      progress(
        msg: string,
        value: number,
        notify: boolean = false,
        id?: string
      ): void;
    }

    export var commandService: {
      registerExternel: (command: {
        id: string;
        description: string;
        extensionName: string;
        methodName: string;
      }) => void;
    }
  }
}
