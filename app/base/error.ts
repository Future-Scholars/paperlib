/**
 * Error catching and logging decorator for a method.
 * @param msg - The message to log.
 * @param notify - Whether to show a notification.
 * @param id - The id of the logger.
 * @param? fallbackReturn - The value to return when an error occurs.
 */
export function errorcatching(
  msg: string,
  notify: boolean,
  id: string,
  fallbackReturn?: any,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const isAsync = originalMethod.constructor.name === "AsyncFunction";

    if (isAsync) {
      descriptor.value = async function (...args: any[]) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          if (globalThis["PLAPI"]) {
            await PLAPI.logService.error(msg, error as Error, notify, id);
          } else {
            console.error(msg, error);
          }
          console.error(`Args: ${args}`);

          if (fallbackReturn) {
            return fallbackReturn;
          }
        }
      };
    } else {
      descriptor.value = function (...args: any[]) {
        try {
          return originalMethod.apply(this, args);
        } catch (error) {
          if (globalThis["PLAPI"]) {
            PLAPI.logService.error(msg, error as Error, notify, id);
          } else {
            console.error(msg, error);
          }
          console.error(`Args: ${args}`);

          if (fallbackReturn) {
            return fallbackReturn;
          }
        }
      };
    }
  };
}
