import { UtilityProcess } from "electron";

export class ProcessStorage {
  private readonly _processes: Record<string, UtilityProcess>;

  constructor() {
    this._processes = {};

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        } else {
          return this.get(prop as string);
        }
      },
      set: (target, prop, value) => {
        if (prop in target) {
          target[prop] = value;
        } else {
          this.set(prop as string, value as UtilityProcess);
        }
        return true;
      },
      deleteProperty: (target, prop) => {
        if (prop in target) {
          delete target[prop];
        } else {
          this.destroy(prop as string);
        }
        return true;
      },
    });
  }

  get(id: string): UtilityProcess {
    return this._processes[id];
  }

  all(): Record<string, UtilityProcess> {
    return this._processes;
  }

  set(id: string, process: UtilityProcess): void {
    this._processes[id] = process;
  }

  destroy(id: string): void {
    try {
      let process: UtilityProcess | undefined;
      if (typeof id === "string") {
        process = this._processes[id];
        delete this._processes[id];
      }
      if (process) {
        process.kill();
      }
    } catch (e) {
      console.error(e);
    }
  }

  has(id: string | number): boolean {
    // TODO: Check if the process is still alive.
    return id in this._processes;
  }
}
