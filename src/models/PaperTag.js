export const PaperTagSchema = {
  name: "PaperTag",
  primaryKey: "_id",
  properties: {
    _id: "objectId",
    _partition: "string?",
    name: "string",
    count: "int",
  },
};
