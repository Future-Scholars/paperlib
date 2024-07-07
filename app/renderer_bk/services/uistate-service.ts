import { Eventable, IEventState } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { FeedEntity } from "@/models/feed-entity";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";

export interface IUIStateServiceState {
  // =========================================
  // Main Paper/Feed panel
  contentType: string;
  mainViewFocused: boolean;
  editViewShown: boolean;
  feedEditViewShown: boolean;
  paperSmartFilterEditViewShown: boolean;
  preferenceViewShown: boolean;
  deleteConfirmShown: boolean;
  overlayNoticationShown: boolean;
  renderRequired: number;
  feedEntityAddingStatus: number;

  entitiesReloaded: number;

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
  selectedQuerySentenceIds: string[];
  selectedFeed: string;

  showingCandidatesId: string;
  metadataCandidates: Record<string, PaperEntity[]>;

  editingPaperSmartFilter: PaperSmartFilter;

  querySentencesSidebar: Array<string>;
  querySentenceCommandbar: string;

  dragingIds: Array<string>;

  // =========================================
  // Command/Search Bar
  commandBarText: string;
  commandBarSearchMode: "general" | "fulltext" | "advanced";

  // =========================================
  // DEV
  isDevMode: boolean;
  os: string;

  // =========================================
  // Processing States
  "processingState.general": number;
}

export const IUIStateService = createDecorator("uiStateService");

/**
 * UI service is responsible for managing the UI state.*/
export class UIStateService extends Eventable<IUIStateServiceState> {
  public readonly processingState: SubStateGroup<IProcessingState>;

  constructor() {
    super("uiStateService", {
      contentType: "library",
      mainViewFocused: true,
      editViewShown: false,
      feedEditViewShown: false,
      paperSmartFilterEditViewShown: false,
      preferenceViewShown: false,
      deleteConfirmShown: false,
      overlayNoticationShown: false,
      renderRequired: -1,
      feedEntityAddingStatus: 0,

      entitiesReloaded: 0,

      selectedIndex: [],
      selectedIds: [],
      selectedPaperEntities: [],
      selectedFeedEntities: [],
      selectedQuerySentenceIds: ["lib-all"],
      selectedFeed: "feed-all",
      dragingIds: [],

      showingCandidatesId: "",
      metadataCandidates: {},

      querySentencesSidebar: [],
      querySentenceCommandbar: "",

      editingPaperSmartFilter: new PaperSmartFilter(),

      commandBarText: "",
      commandBarSearchMode: "general",

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
    // Theme Listener
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        this.setState({ renderRequired: Date.now() });
      });
  }

  /**
   * Set the state of the UI service. Many UI components are controlled by the UI states.
   * @param patch - patch to the state. It can be a single state, a partial state or a full state.
   */
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
        this.fire({ [key]: value });
      }
    }
  }

  /**
   * Get the UI state.
   * @param stateKey - key of the state
   * @returns The state
   */
  getState(stateKey: keyof IUIStateServiceState) {
    return this._state[stateKey];
  }

  /**
   * Get all UI states.
   * @returns The state
   */
  getStates() {
    return this._state;
  }

  /**
   * Reset all UI states to default.
   */
  resetStates() {
    const patch = {
      contentType: "library",
      mainViewFocused: true,
      editViewShown: false,
      feedEditViewShown: false,
      paperSmartFilterEditViewShown: false,
      deleteConfirmShown: false,
      overlayNoticationShown: false,
      candidatesViewShown: false,
      renderRequired: -1,
      feedEntityAddingStatus: 0,
      selectedIndex: [],
      selectedIds: [],
      selectedPaperEntities: [],
      selectedFeedEntities: [],
      selectedFeed: "feed-all",
      dragingIds: [],
      pluginLinkedFolder: "",
      commandBarText: "",
      commandBarSearchMode: "general",
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
