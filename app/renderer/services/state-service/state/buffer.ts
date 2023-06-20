import { defineStore } from "pinia";

import { Feed } from "@/models/feed";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";

export interface IBufferState {
  editingPaperEntityDraft: PaperEntity;
  editingFeedDraft: Feed;
  editingPaperSmartFilterDraft: PaperSmartFilter;
}

export const defineBufferState = defineStore("bufferState", {
  state: (): IBufferState => {
    return {
      editingPaperEntityDraft: new PaperEntity(false),
      editingFeedDraft: new Feed(false),
      editingPaperSmartFilterDraft: new PaperSmartFilter("", ""),
    };
  },
});
