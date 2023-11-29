import { PLAPI } from "paperlib";

class SimpleExtension {
  name: string = "SimpleCMD";
  description: string = "This is a simple demo command extension in Paperlib.";
  author: string = "Paperlib";

  echo() {
    console.log("Hello - log in extension");
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
