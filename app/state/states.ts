import { ObjectId } from "bson";

import { Feed } from "@/models/feed";
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

  contentType: string;
  searchText: string;
  searchMode: string;
  feedEntityAddingStatus: number;

  inputFieldFocused: boolean;

  sidebarWidth: number;

  realmReiniting: number;
  realmReinited: number;
  scraperReinited: number;
  downloaderReinited: number;
  storageBackendReinited: number;
  renderRequired: number;

  syncFileStorageAvaliable: boolean;
}

export interface BufferState {
  editingPaperEntityDraft: PaperEntity;
  editingFeedDraft: Feed;
}

export interface DBState {
  entitiesUpdated: number;
  tagsUpdated: number;
  foldersUpdated: number;
  feedsUpdated: number;
  feedEntitiesUpdated: number;
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

export interface PreviewViewState {
  isRendering: boolean;
}
