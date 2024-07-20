declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

declare module "*.png?asset" {
  const src: string;
  export default src;
}

declare module "*?modulePath" {
  const path: string;
  export default path;
}
