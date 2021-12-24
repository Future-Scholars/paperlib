export const PaperFolderSchema = {
  name: "PaperFolder",
  primaryKey: "_id",
  properties: {
    id: "string",
    _id: "string",
    _partition: "string?",
    name: "string",
    count: "int",
  },
};
