import { defineStore } from "pinia";

export interface IDBState {
  entitiesUpdated: number;
  tagsUpdated: number;
  foldersUpdated: number;
  smartfiltersUpdated: number;
  feedsUpdated: number;
  feedEntitiesUpdated: number;
}

export const defineDBState = defineStore("dbState", {
  state: (): IDBState => {
    return {
      entitiesUpdated: 0,
      tagsUpdated: 0,
      foldersUpdated: 0,
      smartfiltersUpdated: 0,
      feedsUpdated: 0,
      feedEntitiesUpdated: 0,
    };
  },
});
