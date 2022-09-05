export class State {
  private key: string;
  private _value: any;
  private publishChannel: BroadcastChannel | null;
  private checkDuplicated: boolean;

  constructor(
    key: string,
    value: any,
    publishChannel: BroadcastChannel | null,
    checkDuplicated: boolean = true
  ) {
    this.key = key;
    this._value = value;
    this.publishChannel = publishChannel;
    this.checkDuplicated = checkDuplicated;
  }

  public get value() {
    return this._value;
  }

  public set value(theValue: any) {
    let changed;
    if (this.checkDuplicated) {
      changed = this._value !== theValue;
    } else {
      changed = true;
    }
    this._value = theValue;
    if (this.publishChannel && changed) {
      this.publishChannel.postMessage({
        key: this.key,
        value: JSON.stringify(this._value),
      });
    }
  }
}
