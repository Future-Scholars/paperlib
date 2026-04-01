export class SyncCrdtError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncCrdtError'
  }
}