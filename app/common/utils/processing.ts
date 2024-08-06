// =========================================
// Processing State Sub State
export enum ProcessingKey {
  General = "general",
}

/**
 * Processing decorator for a method. It will increment the processing count and decrement it when the method is done
 * to trigger something such as a spinner.
 * @param key
 */
export function processing(key: ProcessingKey) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const isAsync = originalMethod.constructor.name === "AsyncFunction";

    if (isAsync) {
      descriptor.value = async function (...args: any[]) {
        if (
          globalThis["PLUIAPI"] &&
          globalThis["PLUIAPI"]["uiStateService"] &&
          globalThis["PLUIAPI"]["uiStateService"].processingState
        ) {
          PLUIAPI.uiStateService.increaseProcessingState(key);

          try {
            const results = await originalMethod.apply(this, args);
            PLUIAPI.uiStateService.decreaseProcessingState(key);
            return results;
          } catch (error) {
            PLUIAPI.uiStateService.decreaseProcessingState(key);
            throw error;
          }
        } else {
          return await originalMethod.apply(this, args);
        }
      };
    } else {
      descriptor.value = function (...args: any[]) {
        if (
          globalThis["PLUIAPI"] &&
          globalThis["PLUIAPI"]["uiStateService"] &&
          globalThis["PLUIAPI"]["uiStateService"].processingState
        ) {
          PLUIAPI.uiStateService.processingState.increaseProcessingState(key);
          try {
            const results = originalMethod.apply(this, args);
            PLUIAPI.uiStateService.decreaseProcessingState(key);
            return results;
          } catch (error) {
            PLUIAPI.uiStateService.decreaseProcessingState(key);
            throw error;
          }
        } else {
          return originalMethod.apply(this, args);
        }
      };
    }
  };
}

export interface IProcessingState {
  general: number;
}
