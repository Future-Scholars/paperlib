export const formatShortcut = (event: KeyboardEvent): string[] => {
  let shortcutKeys: string[] = [];

  if (event.ctrlKey) {
    shortcutKeys.push("Control");
  }

  if (event.metaKey) {
    shortcutKeys.push("Command");
  }

  if (event.altKey) {
    shortcutKeys.push("Alt");
  }
  if (event.shiftKey) {
    shortcutKeys.push("Shift");
  }
  let key = event.key.trim();
  if (event.code === "Space") {
    key = event.code.trim();
  }
  if (key.length === 1) {
    key = key.toUpperCase();
  }
  if (!shortcutKeys.includes(key)) {
    shortcutKeys.push(key);
  }
  return shortcutKeys;
};
