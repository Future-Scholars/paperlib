async function mainFunc() {
  const myArray = {};

  async function waitForAPI(
    namespace: string,
    timeout: number
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      // check if the protocol is already created.
      for (let i = 0; i < timeout / 100; i++) {
        if (myArray[namespace]) {
          resolve(true);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (myArray[namespace]) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  setTimeout(() => {
    myArray["PLAPI"] = true;
  }, 500);

  const hasAPI = await waitForAPI("PLAPI", 200);

  console.log("RUNNNN", hasAPI);
}

mainFunc();
