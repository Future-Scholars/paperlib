declare global {
  var PLUIAPI: undefined;

  interface Window {
    electron: ElectronAPI;
  }
}

declare module "*.png?asset" {
  const src: string;
  export default src;
}
