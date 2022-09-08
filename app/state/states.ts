import { ObjectId } from "bson";

import { PaperEntity } from "@/models/paper-entity";

export interface LogState {
  processLog: string;
  alertLog: string;
  infoLog: string;
}

export interface ViewState {
  isDeleteConfirmShown: boolean;
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

  inputFieldFocused: boolean;

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

export interface DataViewState {
  showPubTime: boolean;
  showPublication: boolean;
  showPubType: boolean;
  showFlag: boolean;
  showTags: boolean;
  showFolders: boolean;
  showRating: boolean;
  showNote: boolean;
}

export interface BufferState {
  editingPaperEntityDraft: PaperEntity;
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
