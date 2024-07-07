import { CommandService } from "./command-service";
import { ShortcutService } from "./shortcut-service";
import { UISlotService } from "./uislot-service";
import { UIStateService } from "./uistate-service";
import { QuerySentenceService } from "./querysentence-service";

export type IInjectable =
  | CommandService
  | ShortcutService
  | UISlotService
  | UIStateService
  | QuerySentenceService;