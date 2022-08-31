import { PaginatorData } from "./paginator-data";

export class SurveyListState {
    selectedFilters: any[];
    search: string;
    surveysLength: number = 0;
    paginatorData: PaginatorData = {
      page: 0, 
      first: 0,
      rows: 10,
      pageCount: 1
    };
}
