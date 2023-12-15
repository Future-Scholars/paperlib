import { getCurrentScope, onScopeDispose } from "vue";

/**
 * Disposable decorator.
 * Release some resource when component destroy.
 * For example, release some event listener of a service.
 */
export function disposable(cancelHandler?: () => void) {
  if (cancelHandler) {
    if (getCurrentScope()) {
      onScopeDispose(cancelHandler);
    } else {
      throw new Error("Please use decorator outside vue.");
    }
  } else {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = function (...args: any[]) {
        const cancelHandler = originalMethod.apply(this, args);
        if (getCurrentScope()) {
          onScopeDispose(cancelHandler);
        } else {
          console.warn("check this");
          target.dispose_list.push(cancelHandler);
        }
      };
    };
  }
}

export interface IDisposable {
  dispose: () => void;
}
