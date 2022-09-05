import { ObjectId } from "bson";

export interface LogState {
  processLog: string;
  alertLog: string;
  infoLog: string;
}

export interface ViewState {
  isModalShown: boolean;
  isEditViewShown: boolean;
  isPreferenceViewShown: boolean;
  isFeedEditViewShown: boolean;

  processingQueueCount: number;
  entitiesCount: number;
  feedEntitiesCount: number;

  sortBy: string;
  sortOrder: string;
  viewType: string;
  contentType: string;
  searchText: string;
  searchMode: string;

  sidebarWidth: number;
  sidebarSortBy: string;
  sidebarSortOrder: string;
  sidebarShowCount: boolean;
  sidebarCompact: boolean;

  preferenceUpdated: number;
  realmReinited: number;
  storageBackendReinited: number;
  renderRequired: number;

  syncFileStorageAvaliable: boolean;
}

export interface DBState {
  entitiesUpdated: number;
  tagsUpdated: number;
  foldersUpdated: number;
  feedsUpdated: number;
  feedEntitiesUpdated: number;
  defaultPath: string;
}

export interface SelectionState {
  selectedIndex: number[];
  selectedIds: (string | ObjectId)[];
  selectedCategorizer: string;
  selectedFeed: string;
  dragedIds: (string | ObjectId)[];
  pluginLinkedFolder: string;
  editingCategorizer: string;
}
