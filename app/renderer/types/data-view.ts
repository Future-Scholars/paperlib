export interface ItemField {
  type: "string" | "boolean" | "html" | "flag" | "rating" | "file" | "code";
  value: any;
  width: number;
}

export interface FieldTemplate extends ItemField {
  label: string;
  sortBy?: string;
  sortOrder?: string;
}
