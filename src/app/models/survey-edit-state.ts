import { PaginatorData } from "./paginator-data";
import { SurveyImpl } from "./survey-impl";

export class SurveyEditState {
  survey: SurveyImpl;
  budgetAmount: string;
  rewardAmount: string;
  gasReserveAmount: string;
  paginatorData: PaginatorData = {
    page: 0, 
    first: 0,
    rows: 5,
    pageCount: 1
  };
  validated: boolean;
  txHash: string;
}
