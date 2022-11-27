import { PaginatorData } from "./paginator-data";

export class SurveyListState {
    selectedFilters: any[];
    search: string;
    surveysTotal: number = 0;
    paginatorData: PaginatorData = {
      page: 0, 
      first: 0,
      rows: 12,
      pageCount: 1
    };
}
