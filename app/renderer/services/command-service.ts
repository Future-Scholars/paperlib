import { createDecorator } from "@/base/injection/injection";
import {
  IStateService,
  StateService,
} from "@/renderer/services/state-service/state-service";

export const ICommandService = createDecorator("commandService");

export interface ICommand {
  id: string;
  description: string;
  handler: (...args: any[]) => void;
}

export interface IExternelCommand {
  id: string;
  description: string;
  extensionName: string;
  methodName: string;
}

export class CommandService {
  private readonly _registeredCommands: { [id: string]: ICommand } = {};

  constructor(@IStateService private readonly _stateService: StateService) {
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
        console.log("search", keyword);
        this._stateService.set({
          "viewState.searchMode": "general",
        });
        this._stateService.set({
          "viewState.searchText": keyword,
        });
      },
    });

    this.register({
      id: "search_fulltext",
      description: "Search the library by fulltext.",
      handler: (keyword: string) => {
        this._stateService.set({
          "viewState.searchMode": "fulltext",
        });
        this._stateService.set({
          "viewState.searchText": keyword,
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
        this._stateService.set({
          "viewState.searchText": keyword,
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
      return command.handler(...args);
    }
  }

  registerExternel(command: IExternelCommand) {
    console.log(command);
    this._registeredCommands[command.id] = {
      id: command.id,
      description: command.description,
      handler: (...args: any[]) => {},
    };
  }
}
