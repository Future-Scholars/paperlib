export interface ItemField {
  type:
    | "string"
    | "boolean"
    | "html"
    | "flag"
    | "rating"
    | "file"
    | "code"
    | "html-read";
  value: any;
  width: number;
  highlightable?: boolean;
}

export interface FieldTemplate extends ItemField {
  label: string;
  sortBy?: string;
  sortOrder?: string;
  short?: boolean;
}
