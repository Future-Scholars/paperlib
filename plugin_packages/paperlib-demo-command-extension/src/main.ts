import { PLAPI } from "paperlib";

class SimpleExtension {
  name: string = "SimpleExtension";
  description: string = "This is a simple demo command extension in Paperlib.";

  echo() {
    console.log("Hello - log in extension");
    PLAPI.logService.info("Hello", "log from extension process", true);
    PLAPI.logService.warn("Hello", "warn from extension process", true);
  }
}

function initialize() {
  const extension = new SimpleExtension();

  PLAPI.commandService.on("command_echo", () => {
    extension.echo();
  });

  PLAPI.commandService.registerExternel({
    id: "command_echo",
    description: "Hello from the extension process",
    event: "command_echo",
  });

  return extension;
}

export { initialize };
