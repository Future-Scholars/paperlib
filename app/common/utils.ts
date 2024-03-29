const isMac = process.platform === "darwin";

export const formatShortcut = (event: KeyboardEvent): string[] => {
  let shortcutKeys: string[] = [];

  if (event.ctrlKey) {
    shortcutKeys.push("Control");
  }

  if (event.metaKey) {
    if (isMac) {
      shortcutKeys.push("Command");
    } else {
      shortcutKeys.push("Meta");
    }
  }

  if (event.altKey) {
    shortcutKeys.push("Alt");
  }
  if (event.shiftKey) {
    shortcutKeys.push("Shift");
  }
  let key = event.key.trim();
  if (key !== "Meta") {
    if (event.code === "Space") {
      key = event.code.trim();
    }
    if (key.length === 1) {
      key = key.toUpperCase();
    }
    if (!shortcutKeys.includes(key)) {
      shortcutKeys.push(key);
    }
  }

  return shortcutKeys;
};
