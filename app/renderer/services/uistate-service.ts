import { Eventable, IEventState } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Feed } from "@/models/feed";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";

export interface IUIStateServiceState {
  // =========================================
  // Details panel
  "slotsState.paperDetailsPanelSlot1": {
    [id: string]: { title: string; content: string };
  };
  "slotsState.paperDetailsPanelSlot2": {
    [id: string]: { title: string; content: string };
  };
  "slotsState.paperDetailsPanelSlot3": {
    [id: string]: { title: string; content: string };
  };

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

  // selectedIndex: contains the index of the selected papers in the dataview.
  // It should be the only state that is used to control the selection.
  selectedIndex: Array<number>;
  // selectedIds: contains the ids of the selected papers in the current dataview.
  // It can be accessed in any component. But it is read-only. It can be only changed by the event listener of selectedIndex in the dataview.
  selectedIds: Array<string>;
  // selectedPaperEntities/selectedFeedEntities: contains the selected paper/feed entities in the current dataview.
  // It can be accessed in any component. But it is read-only. It can be only changed by the event listener of selectedIndex in the dataview.
  selectedPaperEntities: Array<PaperEntity>;
  selectedFeedEntities: Array<FeedEntity>;
  selectedCategorizer: string;
  selectedFeed: string;

  dragingIds: Array<string>;

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
  public readonly processingState: SubStateGroup<IProcessingState>;
  public readonly slotsState: SubStateGroup<ISlotsState>;

  constructor() {
    super("uiStateService", {
      "slotsState.paperDetailsPanelSlot1": {},
      "slotsState.paperDetailsPanelSlot2": {},
      "slotsState.paperDetailsPanelSlot3": {},

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
    this.processingState = new SubStateGroup("processingState", {
      general: 0,
    });
    for (const [key, value] of Object.entries(
      this.processingState.useState()
    )) {
      if (key.startsWith("$")) {
        continue;
      }
      this.fire({ [`processingState.${key}`]: value });
      this.processingState.on(key as any, (value) => {
        this.fire({
          [`processingState.${key}`]: value.value,
        });
      });
    }

    // =========================================
    // Slots States Group
    this.slotsState = new SubStateGroup("slotsState", {
      paperDetailsPanelSlot1: {},
      paperDetailsPanelSlot2: {},
      paperDetailsPanelSlot3: {},
    });
    for (const [key, value] of Object.entries(this.slotsState.useState())) {
      if (key.startsWith("$")) {
        continue;
      }
      this.fire({ [`slotsState.${key}`]: value });
      this.slotsState.on(key as any, (value) => {
        this.fire({
          [`slotsState.${key}`]: value.value,
        });
      });
    }
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
        } else if (stateGroup === "slotsState") {
          const slotID = value["id"];
          const slotState = JSON.parse(
            JSON.stringify(this.slotsState.getState(stateKey as any))
          );
          slotState[slotID] = value;

          this.slotsState.setState({ [stateKey]: slotState });
        } else {
          throw new Error(`State group '${stateGroup}' is not supported!`);
        }
      } else {
        this.fire({ [key]: value });
      }
    }
  }

  getState(stateKey: keyof IUIStateServiceState) {
    return this._state[stateKey];
  }

  getStates() {
    return this._state;
  }

  resetStates() {
    const patch = {
      contentType: "library",
      mainViewFocused: true,
      inputFieldFocused: false,
      isEditViewShown: false,
      isFeedEditViewShown: false,
      isPaperSmartFilterEditViewShown: false,
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
      os: process.platform,
    };
    this.fire(patch);
  }
}

class SubStateGroup<T extends IEventState> extends Eventable<T> {
  constructor(stateID: string, defaultState: T) {
    super(stateID, defaultState);
  }

  setState(patch: Partial<T>) {
    this.fire(patch);
  }

  getState(stateKey: keyof T) {
    return this._state[stateKey as string];
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

    if (isAsync) {
      descriptor.value = async function (...args: any[]) {
        // TODO: check handle error

        if (
          globalThis["uiStateService"] &&
          globalThis["uiStateService"].processingState
        ) {
          uiStateService.processingState.setState({
            [key]: uiStateService.processingState.getState(key) + 1,
          });

          try {
            const results = await originalMethod.apply(this, args);
            uiStateService.processingState.setState({
              [key]: uiStateService.processingState.getState(key) - 1,
            });
            return results;
          } catch (error) {
            uiStateService.processingState.setState({
              [key]: uiStateService.processingState.getState(key) - 1,
            });
            throw error;
          }
        } else {
          return await originalMethod.apply(this, args);
        }
      };
    } else {
      descriptor.value = function (...args: any[]) {
        if (
          globalThis["uiStateService"] &&
          globalThis["uiStateService"].processingState
        ) {
          uiStateService.processingState.setState({
            [key]: uiStateService.processingState.getState(key) + 1,
          });
          try {
            const results = originalMethod.apply(this, args);
            uiStateService.processingState.setState({
              [key]: uiStateService.processingState.getState(key) - 1,
            });
            return results;
          } catch (error) {
            uiStateService.processingState.setState({
              [key]: uiStateService.processingState.getState(key) - 1,
            });
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

// =========================================
// Slots State Sub State

export interface ISlotsState {
  paperDetailsPanelSlot1: {
    [id: string]: { title: string; content: string };
  };
  paperDetailsPanelSlot2: {
    [id: string]: { title: string; content: string };
  };
  paperDetailsPanelSlot3: {
    [id: string]: { title: string; content: string };
  };
}
