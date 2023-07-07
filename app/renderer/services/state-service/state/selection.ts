import { ObjectId } from "bson";
import { defineStore } from "pinia";

export interface ISelectionState {
  selectedIndex: number[];
  selectedIds: (string | ObjectId)[];
  selectedCategorizer: string;
  selectedFeed: string;
  dragedIds: (string | ObjectId)[];
  pluginLinkedFolder: string;
  editingCategorizer: string;
}

export const defineSelectionState = defineStore("selectionState", {
  state: (): ISelectionState => {
    return {
      selectedIndex: [] as number[],
      selectedIds: [] as (string | ObjectId)[],
      selectedCategorizer: "lib-all",
      selectedFeed: "feed-all",
      dragedIds: [] as (string | ObjectId)[],
      pluginLinkedFolder: "",
      editingCategorizer: "",
    };
  },
});
