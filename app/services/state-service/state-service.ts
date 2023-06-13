import { Pinia, Store } from "pinia";

import { createDecorator } from "@/base/injection/injection";
import {
  ISelectionState,
  defineSelectionState,
} from "@/services/state-service/state//selection";
import {
  IBufferState,
  defineBufferState,
} from "@/services/state-service/state/buffer";
import { IDBState, defineDBState } from "@/services/state-service/state/db";
import { ILogState, defineLogState } from "@/services/state-service/state/log";
import {
  IViewState,
  defineViewState,
} from "@/services/state-service/state/view";

export const IStateService = createDecorator("stateService");

export class StateService {
  readonly logState: Store<string, ILogState>;
  readonly viewState: Store<string, IViewState>;
  readonly bufferState: Store<string, IBufferState>;
  readonly dbState: Store<string, IDBState>;
  readonly selectionState: Store<string, ISelectionState>;

  constructor() {
    this.logState = this.useLogState();
    this.viewState = this.useViewState();
    this.bufferState = this.useBufferState();
    this.dbState = this.useDBState();
    this.selectionState = this.useSelectionState();
  }

  useLogState = defineLogState;
  useViewState = defineViewState;
  useBufferState = defineBufferState;
  useDBState = defineDBState;
  useSelectionState = defineSelectionState;
}
