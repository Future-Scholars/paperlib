const isMac = process.platform === "darwin";

export const cmdOrCtrl = isMac ? "Command" : "Control";

export interface ShortcutEvent {
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  key: string;
  code: string;
  preventDefault?: () => void;
  stopPropagation?: () => void;
  isInput?: boolean;
  target?: EventTarget | null;
}

export const formatShortcut = (
  event: Pick<
    ShortcutEvent,
    "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "key" | "code"
  >
): string[] => {
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

export const formatKeycode = (code: string): string => {
  return code.replace("CommandOrControl", cmdOrCtrl);
};

export const convertKeyboardEvent = (e: KeyboardEvent): ShortcutEvent => {
  const isInput =
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement;
  return {
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    altKey: e.altKey,
    shiftKey: e.shiftKey,
    key: e.key,
    code: e.code,
    preventDefault: () => {
      e.preventDefault();
    },
    stopPropagation: () => {
      e.stopPropagation();
    },
    isInput,
    target: e.target,
  };
};

export const formatMouseModifiers = (event: PointerEvent): string[] => {
  let mouseModifiers: string[] = [];

  if (event.ctrlKey) {
    mouseModifiers.push("Control");
  }

  if (event.metaKey) {
    if (isMac) {
      mouseModifiers.push("Command");
    } else {
      mouseModifiers.push("Meta");
    }
  }

  if (event.altKey) {
    mouseModifiers.push("Alt");
  }
  if (event.shiftKey) {
    mouseModifiers.push("Shift");
  }

  return mouseModifiers;
};