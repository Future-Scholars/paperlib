export interface CSL {
  id: string;
  type: string;
  "citation-key": string;
  title: string;
  author: [{ given: string; family: string }];
  issued: {
    "date-parts": [[number]];
  };
  "container-title": string;
  publisher: string;
  page: string;
  volume: string;
  issue: string;
  DOI: string;
}
