import {
  ProcessingKey as _ProcessingKey,
  defineProcessingState,
} from "@/services/state-service/state/processing";

export const ProcessingKey = _ProcessingKey;

/**
 * Processing decorator for a method. It will increment the processing count and decrement it when the method is done
 * to trigger something such as a spinner.
 * @param key
 */
export function processing(key: _ProcessingKey) {
  const processingState = defineProcessingState();

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const isAsync = originalMethod.constructor.name === "AsyncFunction";

    descriptor.value = isAsync
      ? async function (...args: any[]) {
          processingState[key] += 1;
          console.log(processingState[key]);
          const results = await originalMethod(...args);
          processingState[key] -= 1;
          return results;
        }
      : function (...args: any[]) {
          processingState[key] += 1;
          console.log(processingState[key]);
          const results = originalMethod(...args);
          processingState[key] -= 1;
          return results;
        };
  };
}

export const useProcessingState = defineProcessingState;
