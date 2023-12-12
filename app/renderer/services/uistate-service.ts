import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";

export interface IUIStateServiceState {
  // =========================================
  // Details panel
  paperDetailsPanelSlot1: { [id: string]: { title: string; content: string } };
  paperDetailsPanelSlot2: { [id: string]: { title: string; content: string } };
  paperDetailsPanelSlot3: { [id: string]: { title: string; content: string } };

  // =========================================
  // Main Paper/Feed panel
  //TODO: Choose a consistent name style for this.
  contentType: string;
  mainViewFocused: boolean;
  inputFieldFocused: boolean;
  isEditViewShown: boolean;
  isFeedEditViewShown: boolean;
  isPaperSmartFilterEditViewShown: boolean;
  isPreferenceViewShown: boolean;
  isDeleteConfirmShown: boolean;
  renderRequired: number;
  feedEntityAddingStatus: number;

  selectedIndex: Array<number>;
  selectedIds: Array<string>;
  selectedPaperEntities: Array<PaperEntity>;
  selectedFeedEntities: Array<FeedEntity>;
  selectedCategorizer: string;
  selectedFeed: string;

  dragingIds: Array<string>;
  pluginLinkedFolder: string;

  // =========================================
  // Buffer
  // TODO: rename to buffer
  // TODO: check if all buffer need to be exposed globally
  editingPaperEntityDraft: PaperEntity;
  // TODO: check where use this?
  editingFeedEntityDraft: FeedEntity;
  editingFeedDraft: Feed;
  editingPaperSmartFilterDraft: PaperSmartFilter;
  editingCategorizerDraft: string;
  entitiesCount: number;
  feedEntitiesCount: number;

  // =========================================
  // Command/Search Bar
  commandBarText: string;
  // TODO: add a mode for command, others are for searching.
  commandBarMode: string;

  // =========================================
  // DEV
  isDevMode: boolean;
  os: string;

  // =========================================
  // =========================================
  // Processing States
  "processingState.general": number;
}

export const IUIStateService = createDecorator("uiStateService");

/**
 * UI service is responsible for managing the UI state.*/
export class UIStateService extends Eventable<IUIStateServiceState> {
  private readonly _slotKeys = [
    "paperDetailsPanelSlot1",
    "paperDetailsPanelSlot2",
    "paperDetailsPanelSlot3",
  ];

  public readonly processingState: ProcessingState;

  constructor() {
    super("uiStateService", {
      paperDetailsPanelSlot1: {},
      paperDetailsPanelSlot2: {},
      paperDetailsPanelSlot3: {},

      contentType: "library",
      mainViewFocused: true,
      inputFieldFocused: false,
      isEditViewShown: false,
      isFeedEditViewShown: false,
      isPaperSmartFilterEditViewShown: false,
      isPreferenceViewShown: false,
      isDeleteConfirmShown: false,
      renderRequired: -1,
      feedEntityAddingStatus: 0,

      selectedIndex: [],
      selectedIds: [],
      selectedPaperEntities: [],
      selectedFeedEntities: [],
      selectedCategorizer: "lib-all",
      selectedFeed: "feed-all",
      dragingIds: [],
      pluginLinkedFolder: "",

      editingPaperEntityDraft: new PaperEntity(false),
      editingFeedEntityDraft: new FeedEntity(false),
      editingFeedDraft: new Feed(false),
      editingPaperSmartFilterDraft: new PaperSmartFilter("", ""),
      editingCategorizerDraft: "",
      entitiesCount: 0,
      feedEntitiesCount: 0,

      commandBarText: "",
      commandBarMode: "general",

      isDevMode: false,
      os: process.platform,

      "processingState.general": 0,
    });

    // =========================================
    // Processing States Group
    this.processingState = new ProcessingState();
    for (const [key, value] of Object.entries(
      this.processingState.getStates()
    )) {
      this._state[`processingState.${key}`] = value;

      this.processingState.on(key as any, (value) => {
        this._state[`processingState.${key}`] = value;
      });
    }
  }

  private _setSlot(slotKey: string, value: any) {
    if (!(value instanceof Object)) {
      throw new Error("Slot value must be an object!");
    }
    if (!("id" in value)) {
      throw new Error("Slot value must have an id!");
    }

    const slot = this._state[slotKey] as {
      [id: string]: { title: string; content: string };
    };

    slot[value.id] = value;
  }

  setState(patch: Partial<IUIStateServiceState>) {
    for (const [key, value] of Object.entries(patch)) {
      const keyParts = key.split(".");

      if (keyParts.length > 2) {
        throw new Error(
          "States key must be in the form of 'stateGroup.key' or 'key'!"
        );
      }

      if (keyParts.length === 2) {
        const [stateGroup, stateKey] = keyParts;
        if (stateGroup === "processingState") {
          this.processingState.setState({ [stateKey]: value });
        } else {
          throw new Error(`State group '${stateGroup}' is not supported!`);
        }
      } else {
        this._state[key] = value;
      }
    }
  }

  getState(stateKey: keyof IUIStateServiceState) {
    return this._state[stateKey];
  }

  getStates() {
    return this._state;
  }
}

// =========================================
// Processing State Sub State
export enum ProcessingKey {
  General = "general",
}

/**
 * Processing decorator for a method. It will increment the processing count and decrement it when the method is done
 * to trigger something such as a spinner.
 * @param key
 */
export function processing(key: ProcessingKey) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const isAsync = originalMethod.constructor.name === "AsyncFunction";

    if (isAsync)
      descriptor.value = async function (...args: any[]) {
        // TODO: check handle error

        if (globalThis["uiStateService"]) {
          uiStateService.processingState[key] += 1;

          try {
            const results = await originalMethod.apply(this, args);
            uiStateService.processingState[key] -= 1;
            return results;
          } catch (error) {
            uiStateService.processingState[key] -= 1;
            throw error;
          }
        } else {
          return await originalMethod.apply(this, args);
        }
      };
    else {
      descriptor.value = function (...args: any[]) {
        if (globalThis["uiStateService"]) {
          uiStateService.processingState[key] += 1;

          try {
            const results = originalMethod.apply(this, args);
            uiStateService.processingState[key] -= 1;
            return results;
          } catch (error) {
            uiStateService.processingState[key] -= 1;
            throw error;
          }
        } else {
          return originalMethod.apply(this, args);
        }
      };
    }
  };
}

export interface IProcessingState {
  general: number;
}

class ProcessingState extends Eventable<IProcessingState> {
  constructor() {
    super("processingState", {
      general: 0,
    });
  }

  setState(patch: Partial<IProcessingState>) {
    for (const [key, value] of Object.entries(patch)) {
      this._state[key] = value;
    }
  }

  getState(stateKey: keyof IProcessingState) {
    return this._state[stateKey];
  }

  getStates() {
    return this._state;
  }
}
