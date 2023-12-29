function replacer(key: any, value: any) {
  if (value instanceof Map) {
    return {
      _dataType: "Map",
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

function reviver(key: any, value: any) {
  if (typeof value === "object" && value !== null) {
    if (value._dataType === "Map") {
      return new Map(value.value);
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
