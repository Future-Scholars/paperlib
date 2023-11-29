import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  IStateService,
  StateService,
} from "@/renderer/services/state-service/state-service";

export const ICommandService = createDecorator("commandService");

export interface ICommand {
  id: string;
  description: string;
  handler?: (...args: any[]) => void;
  event?: string;
}

export interface IExternelCommand {
  id: string;
  description: string;
  event?: string;
}

export class CommandService extends Eventable<{}> {
  private readonly _registeredCommands: { [id: string]: ICommand } = {};

  constructor(@IStateService private readonly _stateService: StateService) {
    super("commandService", {});
    this._registerInnerCommands();
  }

  getRegisteredCommands(filter: string = "") {
    if (filter) {
      return Array.from(
        Object.keys(this._registeredCommands)
          .filter((c) => c.startsWith(filter))
          .map((c) => this._registeredCommands[c])
          .values()
      ).sort((a, b) => a.id.localeCompare(b.id));
    }
    return Array.from(Object.values(this._registeredCommands)).sort((a, b) =>
      a.id.localeCompare(b.id)
    );
  }

  private _registerInnerCommands() {
    this.register({
      id: "search",
      description: "Search the library by keyword.",
      handler: (keyword: string) => {
        this._stateService.set({
          "viewState.searchMode": "general",
        });
      },
    });

    this.register({
      id: "search_fulltext",
      description: "Search the library in fulltext mode.",
      handler: (keyword: string) => {
        this._stateService.set({
          "viewState.searchMode": "fulltext",
        });
      },
    });

    this.register({
      id: "search_advanced",
      description: "Search the library by advanced query.",
      handler: (keyword: string) => {
        this._stateService.set({
          "viewState.searchMode": "advanced",
        });
      },
    });
  }

  register(command: ICommand) {
    this._registeredCommands[command.id] = command;
  }

  run(id: string, ...args: any[]): void {
    const command = this._registeredCommands[id];
    if (command) {
      logService.log("info", `Run command: ${command.id} with args: ${args}`);
      if (command.event) {
        this.fire({ [command.event]: args });
      }
      if (command.handler) {
        if (command.handler.length === 0) {
          return command.handler();
        } else {
          return command.handler(...args);
        }
      }
    }
  }

  registerExternel(command: IExternelCommand) {
    logService.log(
      "info",
      `Register externel command: ID - ${command.id} | Event - ${command.event} | Description - ${command.description} `
    );

    if (this._registeredCommands[command.id]) {
      logService.log(
        "warn",
        `Externel command ID ${command.id} has already been registered.`
      );
      throw new Error(
        `Externel command ID ${command.id} has already been registered.`
      );
    } else {
      this._registeredCommands[command.id] = {
        id: command.id,
        description: command.description,
        handler: (...args: any[]) => {},
        event: command.event,
      };
    }
  }
}
