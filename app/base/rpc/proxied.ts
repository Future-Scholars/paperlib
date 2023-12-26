export type Dto<T> = T;

// export type Proxied<T> = {
//   [K in keyof T]: T[K] extends (...args: infer A) => infer R
//     ? (...args: { [K in keyof A]: Dto<A[K]> }) => Promise<Dto<Awaited<R>>>
//     : never;
// };

export type Proxied<T> = {
  [K in keyof T]: K extends "on" | "once" | "already" | "onChanged" | "onClick"
    ? (...args: any[]) => () => void
    : T[K] extends (...args: infer A) => infer R
    ? (...args: { [K in keyof A]: A[K] }) => Promise<Awaited<R>>
    : never;
};
