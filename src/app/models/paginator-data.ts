export interface PaginatorData {
  page: number;// Index of the new page
  first: number;// Index of the first record
  rows: number;// Number of rows to display in new page
  pageCount: number;// Total number of pages
}

export interface PaginatorRows {
  value: number;
}
