import { PLAPI } from "paperlib";

class SimpleExtension {
  name: string = "SimpleExtension";

  echo() {
    console.log("Hello - in extension");
  }
}

function initialize() {
  const extension = new SimpleExtension();

  PLAPI.commandService.registerExternel({
    id: "echo",
    description: "Echo hello",
    extensionName: extension.name,
    methodName: "echo",
  });
  
  return extension;
}

export { initialize };
