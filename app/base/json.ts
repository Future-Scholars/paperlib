function replacer(key: any, value: any) {
  if (value === undefined || value === null) {
    return value;
  }

  if (value instanceof Map) {
    return {
      _dataType: "Map",
      value: Array.from(value.entries()),
    };
  } else if (
    value instanceof Error ||
    value.constructor?.name.includes("Error")
  ) {
    return {
      _dataType: "Error",
      value: {
        name: value.name ? value.name || value.constructor.name : "",
        message: value.message ? value.message : "",
        stack: value.stack ? value.stack : "",
      },
    };
  } else {
    return value;
  }
}

function reviver(key: any, value: any) {
  if (typeof value === "object" && value !== null) {
    if (value._dataType === "Map") {
      return new Map(value.value);
    } else if (value._dataType === "Error") {
      const error = new Error();
      error.name = value.value.name;
      error.message = value.value.message;
      error.stack = value.value.stack;
      return error;
    }
  }
  return value;
}

export function JSONstringify(obj: any) {
  return JSON.stringify(obj, replacer);
}

export function JSONparse(str: string) {
  return JSON.parse(str, reviver);
}
