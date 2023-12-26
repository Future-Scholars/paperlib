export const chunkRun = async <S, T, Q>(
  argsList: Iterable<S>,
  process: (arg: S) => Promise<T>,
  errorProcess?: (arg: S) => Promise<Q>,
  chunkSize = 10
): Promise<{
  results: Q extends null ? (T | null)[] : (T | Q)[];
  errors: Error[];
}> => {
  let results: (T | null | Q)[] = [];

  const errors: Error[] = [];

  let argsArray: Array<S>;
  if (!argsList.hasOwnProperty("length") || !argsList.hasOwnProperty("slice")) {
    argsArray = Array.from(argsList) as Array<S>;
  } else {
    argsArray = argsList as Array<S>;
  }

  for (let i = 0; i < argsArray.length; i += chunkSize) {
    const chunkArgs = argsArray.slice(i, i + chunkSize);

    const chunkResult = await Promise.allSettled(
      chunkArgs.map(async (arg) => {
        // if process is a arrow function
        if (process.prototype === undefined) {
          return await process(arg);
        } else {
          return await (process as Function).apply(this, arg);
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
            results.push(
              await (errorProcess as Function).apply(this, chunkArgs[j])
            );
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
