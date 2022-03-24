import { v4 as uuid } from 'uuid';
import { app, BrowserWindow } from '@electron/remote';

export class State<T> {
  value: T;
  id: string;
  checkDuplicated: boolean;

  constructor(value: T, checkDuplicated = true) {
    this.value = value;
    this.id = uuid();
    this.checkDuplicated = checkDuplicated;
  }

  get() {
    return this.value;
  }

  set(value: T) {
    if (value === this.value && this.checkDuplicated) {
      return;
    }
    this.value = value;
    try {
      const window = BrowserWindow.getAllWindows()[0];
      if (window) {
        window.webContents.send(this.id, this.value);
      }
    } catch (e) {
      console.log(e);
    }
  }
}

export class SharedState {
  viewState: Record<string, State<number | string | boolean>>;
  selectionState: Record<string, State<number | string | boolean>>;
  sharedData: Record<string, State<number | string | boolean>>;
  dbState: Record<string, State<number | string | boolean>>;

  constructor() {
    this.viewState = {
      processingQueueCount: new State(0, false),
      entitiesCount: new State(0),

      sortBy: new State('addTime'),
      sortOrder: new State('desc'),
      searchText: new State(''),
      searchMode: new State('general'),

      isEditViewShown: new State(false),
      isTagViewShown: new State(false),
      isFolderViewShown: new State(false),
      isNoteViewShown: new State(false),
      isPreferenceViewShown: new State(false),

      preferenceUpdated: new State(new Date().getTime()),
      themeUpdated: new State(new Date().getTime()),
      realmReinited: new State(new Date().getTime()),

      alertInformation: new State('', false),

      viewType: new State('list'),
      theme: new State('light'),
      syncFileStorageAvaliable: new State(false),
    };

    // Selection State
    this.selectionState = {
      selectedIndex: new State(''),
      selectedCategorizer: new State(''),
    };

    // Shared Data
    this.sharedData = {
      editEntityDraft: new State(''),
    };
    // DB State
    this.dbState = {
      entitiesUpdated: new State(new Date().getTime()),
      tagsUpdated: new State(new Date().getTime()),
      foldersUpdated: new State(new Date().getTime()),
      defaultPath: new State(app.getPath('userData')),
      selectedPath: new State(''),
    };
  }

  get(dest: string) {
    const state = getObj(this, dest) as State<number | string | boolean>;
    return state;
  }

  set(dest: string, value: number | string | boolean) {
    const state = getObj(this, dest) as State<number | string | boolean>;
    state.set(value);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getObj(obj: any, dest: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return dest.split('.').reduce((a, b) => a[b], obj);
}
