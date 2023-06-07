// Thanks to https://github.dev/microsoft/vscode/

export class LazyPromise implements Promise<any> {
  private _actual: Promise<any> | null;
  private _actualResolve: ((value?: any) => any) | null;
  private _actualReject: ((err?: any) => any) | null;

  private _hasValue: boolean;
  private _value: any;

  protected _hasErr: boolean;
  protected _err: any;

  constructor() {
    this._actual = null;
    this._actualResolve = null;
    this._actualReject = null;
    this._hasValue = false;
    this._value = null;
    this._hasErr = false;
    this._err = null;
  }

  get [Symbol.toStringTag](): string {
    return this.toString();
  }

  private _ensureActual(): Promise<any> {
    if (!this._actual) {
      this._actual = new Promise<any>((resolve, reject) => {
        this._actualResolve = resolve;
        this._actualReject = reject;

        if (this._hasValue) {
          this._actualResolve(this._value);
        }

        if (this._hasErr) {
          this._actualReject(this._err);
        }
      });
    }
    return this._actual;
  }

  public resolve(value: any): void {
    if (this._hasValue || this._hasErr) {
      return;
    }

    this._hasValue = true;
    this._value = value;

    if (this._actual) {
      this._actualResolve!(value);
    }
  }

  public reject(err: any): void {
    if (this._hasValue || this._hasErr) {
      return;
    }

    this._hasErr = true;
    this._err = err;

    if (this._actual) {
      this._actualReject!(err);
    } else {
      console.error(err);
    }
  }

  public then(success: any, error: any): any {
    return this._ensureActual().then(success, error);
  }

  public catch(error: any): any {
    return this._ensureActual().then(undefined, error);
  }

  public finally(callback: () => void): any {
    return this._ensureActual().finally(callback);
  }
}
