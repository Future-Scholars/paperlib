export const PaperFolderSchema = {
  name: "PaperFolder",
  primaryKey: "_id",
  properties: {
    _id: "objectId",
    _partition: "string?",
    name: "string",
    count: "int",
  },
};
