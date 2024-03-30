class PLExtension {
  id;
  defaultPreference;
  constructor({
    id,
    defaultPreference
  }) {
    this.id = id;
    this.checkPreference(defaultPreference);
    this.defaultPreference = defaultPreference;
  }
  checkPreference(preference) {
    if (typeof preference !== "object") {
      throw new Error("Preference must be a dict");
    }
    for (const key in preference) {
      if (!preference[key].type || !["string", "boolean", "options", "pathpicker", "hidden"].includes(
        preference[key].type
      )) {
        throw new Error(
          `Preference ${key} has wrong type ${preference[key].type}`
        );
      }
      if (!preference[key].name) {
        throw new Error(`Preference ${key} has no name`);
      }
      if (!preference[key].description) {
        throw new Error(`Preference ${key} has no description`);
      }
      if (preference[key].value === void 0 || preference[key].value === null) {
        throw new Error(`Preference ${key} has no default value`);
      }
      if (preference[key].type === "options") {
        if (!preference[key].options) {
          throw new Error(`Preference ${key} has no options`);
        }
      }
    }
  }
}

export { PLExtension };
