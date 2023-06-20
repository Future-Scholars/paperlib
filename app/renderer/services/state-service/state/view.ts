import { defineStore } from "pinia";

export interface IViewState {
  os: string;

  isDeleteConfirmShown: boolean;
  isEditViewShown: boolean;
  isPreferenceViewShown: boolean;
  isFeedEditViewShown: boolean;
  isPaperSmartFilterEditViewShown: boolean;

  entitiesCount: number;
  feedEntitiesCount: number;

  viewType: string;
  contentType: string;
  searchText: string;
  searchMode: string;
  feedEntityAddingStatus: number;
  detailsOnDragging: boolean;

  mainViewFocused: boolean;
  inputFieldFocused: boolean;

  realmReiniting: number;
  realmReinited: number;
  scraperReinited: number;
  downloaderReinited: number;
  storageBackendReinited: number;
  renderRequired: number;

  syncFileStorageAvaliable: boolean;
}

export const defineViewState = defineStore("viewState", {
  state: (): IViewState => {
    return {
      os: process.platform,

      // View Shown
      isDeleteConfirmShown: false,
      isEditViewShown: false,
      isPreferenceViewShown: false,
      isFeedEditViewShown: false,
      isPaperSmartFilterEditViewShown: false,

      // Count
      entitiesCount: 0,
      feedEntitiesCount: 0,

      // Mainview
      viewType: "list",
      contentType: "library",
      searchText: "",
      searchMode: "general",
      feedEntityAddingStatus: 0,
      detailsOnDragging: false,

      //
      inputFieldFocused: false,
      mainViewFocused: true,

      // Update Signal
      realmReiniting: 0,
      realmReinited: 0,
      scraperReinited: 0,
      downloaderReinited: 0,
      storageBackendReinited: 0,
      renderRequired: 0,

      //
      syncFileStorageAvaliable: false,
    };
  },
});
