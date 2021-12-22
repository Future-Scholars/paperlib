export const PaperFolderSchema = {
  name: "PaperFolder",
  primaryKey: "_id",
  properties: {
    _id: "string",
    _partition: "string?",
    name: "string",
    count: "int",
  },
};
