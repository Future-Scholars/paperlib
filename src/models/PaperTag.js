export const PaperTagSchema = {
  name: "PaperTag",
  primaryKey: "_id",
  properties: {
    _id: "string",
    _partition: "string?",
    name: "string",
    count: "int",
  },
};
