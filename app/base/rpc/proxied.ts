export type Dto<T> = T;

// export type Proxied<T> = {
//   [K in keyof T]: T[K] extends (...args: infer A) => infer R
//     ? (...args: { [K in keyof A]: Dto<A[K]> }) => Promise<Dto<Awaited<R>>>
//     : never;
// };

export type Proxied<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? K extends
        | "on"
        | "once"
        | "already"
        | "onChanged"
        | "onClick"
        | "hookTransform"
        | "hookModify"
        | "registerExternel"
      ? (...args: A) => () => void
      : K extends "useState"
      ? (...args: A) => R
      : (...args: { [K in keyof A]: A[K] }) => Promise<Awaited<R>>
    : any;
};
