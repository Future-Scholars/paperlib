import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Feed } from "@/models/feed";
import { PaperEntity } from "@/models/paper-entity";
import { PaperSmartFilter } from "@/models/smart-filter";

//TODO: Merge this with UIStateService

export interface IBufferServiceState {
  editingPaperEntityDraft: PaperEntity;
  editingFeedDraft: Feed;
  editingPaperSmartFilterDraft: PaperSmartFilter;
}

export const IBufferService = createDecorator("bufferService");

export class BufferService extends Eventable<IBufferServiceState> {
  constructor() {
    super("bufferService", {
      editingPaperEntityDraft: new PaperEntity(false),
      editingFeedDraft: new Feed(false),
      editingPaperSmartFilterDraft: new PaperSmartFilter("", ""),
    });
  }

  get(key: keyof IBufferServiceState) {
    return this._state[key];
  }

  set(patch: Partial<IBufferServiceState>) {
    this.fire(patch);
  }

  clear(key: keyof IBufferServiceState) {
    this._state.$patch({ [key]: this._eventDefaultState[key] });
  }
}
