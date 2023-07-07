import {
  ProcessingKey as _ProcessingKey,
  defineProcessingState,
} from "@/renderer/services/state-service/state/processing";

export const ProcessingKey = _ProcessingKey;

/**
 * Processing decorator for a method. It will increment the processing count and decrement it when the method is done
 * to trigger something such as a spinner.
 * @param key
 */
export function processing(key: _ProcessingKey) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const isAsync = originalMethod.constructor.name === "AsyncFunction";

    if (isAsync)
      descriptor.value = async function (...args: any[]) {
        processingState[key] += 1;
        const results = await originalMethod.apply(this, args);
        processingState[key] -= 1;
        return results;
      };
    else {
      descriptor.value = function (...args: any[]) {
        processingState[key] += 1;
        const results = originalMethod.apply(this, args);
        processingState[key] -= 1;
        return results;
      };
    }
  };
}

export const useProcessingState = defineProcessingState;
