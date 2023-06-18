export const chunkRun = async <T, Q>(
  argsList: any[],
  process: (...arg: any) => Promise<T>,
  errorProcess?: (...arg: any) => Promise<Q>,
  chunkSize = 10
): Promise<{
  results: Q extends null ? (T | null)[] : (T | Q)[];
  errors: Error[];
}> => {
  let results: (T | null | Q)[] = [];

  const errors: Error[] = [];

  for (let i = 0; i < argsList.length; i += chunkSize) {
    const chunkArgs = argsList.slice(i, i + chunkSize);

    const chunkResult = await Promise.allSettled(
      chunkArgs.map(async (args) => {
        // if process is a arrow function
        if (process.prototype === undefined) {
          return await process(args);
        } else {
          return await process.apply(this, args);
        }
      })
    );

    for (const [j, result] of chunkResult.entries()) {
      if (result.status === "rejected") {
        errors.push(result.reason as Error);

        if (errorProcess) {
          if (errorProcess.prototype === undefined) {
            results.push(await errorProcess(chunkArgs[j]));
          } else {
            results.push(await errorProcess.apply(this, chunkArgs[j]));
          }
        } else {
          results.push(null);
        }
      } else {
        results.push(result.value);
      }
    }
  }

  return {
    results: results as Q extends null ? (T | null)[] : (T | Q)[],
    errors,
  };
};
