import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { ILogService, LogService } from "@/renderer/services/log-service";
import {
  IUIStateService,
  UIStateService,
} from "@/renderer/services/uistate-service";

export const ICommandService = createDecorator("commandService");

export interface ICommand {
  id: string;
  description: string;
  priority: number;
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

  constructor(
    @IUIStateService private readonly _uiStateService: UIStateService,
    @ILogService private readonly _logService: LogService
  ) {
    super("commandService", {});
    this._registerInnerCommands();
  }

  @errorcatching(
    "Failed to get registered commands.",
    true,
    "CommandService",
    []
  )
  getRegisteredCommands(filter: string = "") {
    if (filter) {
      return Array.from(
        Object.keys(this._registeredCommands)
          .filter((c) => c.startsWith(filter))
          .map((c) => this._registeredCommands[c])
          .values()
      ).sort((a, b) => (a.priority < b.priority ? 1 : -1));
    }
    return Array.from(Object.values(this._registeredCommands)).sort((a, b) =>
      a.priority < b.priority ? 1 : -1
    );
  }

  private _registerInnerCommands() {
    this.register({
      id: "search",
      description: "Search the library by keyword.",
      priority: 99999,
      handler: (keyword: string) => {
        this._uiStateService.setState({
          commandBarSearchMode: "general",
        });
      },
    });

    this.register({
      id: "search_fulltext",
      description: "Search the library in fulltext mode.",
      priority: 99998,
      handler: (keyword: string) => {
        this._uiStateService.setState({
          commandBarSearchMode: "fulltext",
        });
      },
    });

    this.register({
      id: "search_advanced",
      description: "Search the library by advanced query.",
      priority: 99997,
      handler: (keyword: string) => {
        this._uiStateService.setState({
          commandBarSearchMode: "advanced",
        });
      },
    });
  }

  @errorcatching("Failed to register command.", true, "CommandService")
  register(command: ICommand) {
    this._registeredCommands[command.id] = command;
  }

  @errorcatching("Failed to run command.", true, "CommandService")
  run(id: string, ...args: any[]): void {
    const command = this._registeredCommands[id];
    if (command) {
      this._logService.info(
        `Run command.`,
        `${command.id} with args: ${args}`,
        false,
        "CommandService"
      );
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

  @errorcatching("Failed to register externel command.", true, "CommandService")
  registerExternel(command: IExternelCommand) {
    this._logService.info(
      `Register externel command.`,
      `ID - ${command.id} | Event - ${command.event} | Description - ${command.description}`,
      false,
      "CommandService"
    );

    if (this._registeredCommands[command.id]) {
      this._logService.warn(
        "Already registered.",
        `Externel command ID ${command.id}`,
        true
      );
      throw new Error(
        `Externel command ID ${command.id} has already been registered.`
      );
    } else {
      this._registeredCommands[command.id] = {
        id: command.id,
        description: command.description,
        priority: 100,
        handler: (...args: any[]) => {},
        event: command.event,
      };
    }

    return () => {
      delete this._registeredCommands[command.id];
    };
  }
}
