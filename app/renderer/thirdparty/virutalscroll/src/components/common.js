export const props = {
  items: {
    type: Object,
    required: true,
  },

  keyField: {
    type: String,
    default: "id",
  },

  direction: {
    type: String,
    default: "vertical",
    validator: (value) => ["vertical", "horizontal"].includes(value),
  },
};

export function simpleArray() {
  return this.items.length && typeof this.items[0] !== "object";
}
