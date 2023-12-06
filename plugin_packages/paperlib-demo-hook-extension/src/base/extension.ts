export abstract class PLExtension {
  id: string;
  name: string;
  description: string;
  author: string;
  defaultPreference: { [key: string]: any };

  constructor({
    id,
    name,
    description,
    author,
    defaultPreference,
  }: {
    id: string;
    name: string;
    description: string;
    author: string;
    defaultPreference: { [key: string]: any };
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.author = author;

    this.checkPreference(defaultPreference);
    this.defaultPreference = defaultPreference;
  }

  abstract initialize(): Promise<void>;

  checkPreference(preference: { [key: string]: any }) {
    // 1. Check is a dict
    if (typeof preference !== "object") {
      throw new Error("Preference must be a dict");
    }
    // 2. Check all key has a type, a name, a description, and a default value.
    for (const key in preference) {
      if (
        !preference[key].type ||
        !["string", "boolean", "options"].includes(preference[key].type)
      ) {
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
      if (
        preference[key].value === undefined ||
        preference[key].value === null
      ) {
        throw new Error(`Preference ${key} has no default value`);
      }

      // If type is options, check options
      if (preference[key].type === "options") {
        if (!preference[key].options) {
          throw new Error(`Preference ${key} has no options`);
        }
      }
    }
  }
}
