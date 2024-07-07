import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";

import { PiniaEventable } from "./pinia-eventable";
import { IUIStateService, UIStateService } from "./uistate-service";

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

export class CommandService extends PiniaEventable<{}> {
  private readonly _registeredCommands: { [id: string]: ICommand } = {};

  constructor(
    @IUIStateService private readonly _uiStateService: UIStateService
  ) {
    super("commandService", {});
    this._registerInnerCommands();
  }

  /**
   * Get registered commands.
   * @param filter - Filter string
   * @returns - Sorted array of filtered commands
   */
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

    this.register({
      id: "scrape_preprints",
      description: "Scrape metadata for all preprint papers in the library.",
      priority: 99996,
      handler: () => {
        PLAPI.paperService.scrapePreprint();
      },
    });
  }

  @errorcatching("Failed to register command.", true, "CommandService")
  register(command: ICommand) {
    this._registeredCommands[command.id] = command;
  }

  /**
   * Run command.
   * @param id - Command ID
   * @param args - Command arguments
   */
  @errorcatching("Failed to run command.", true, "CommandService")
  run(id: string, ...args: any[]): void {
    const command = this._registeredCommands[id];
    if (command) {
      PLAPI.logService.info(
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

  /**
   * Register externel command.
   * @param command - Externel command
   */
  @errorcatching("Failed to register externel command.", true, "CommandService")
  registerExternel(command: IExternelCommand) {
    PLAPI.logService.info(
      `Register externel command.`,
      `ID - ${command.id} | Event - ${command.event} | Description - ${command.description}`,
      false,
      "CommandService"
    );

    if (this._registeredCommands[command.id]) {
      PLAPI.logService.warn(
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
