import { defineStore } from "pinia";

export enum ProcessingKey {
  General = "general",
}

export interface IProcessingState {
  general: number;
}

export const defineProcessingState = defineStore("processingState", {
  state: (): IProcessingState => {
    return {
      general: 0,
    };
  },
});
