export {};

interface PLAPIShape {
  logService: LogService;
}

declare global {
  var PLAPI: PLAPIShape;
}