import { SurveyImpl } from "./survey-impl";

export interface SurveySearchResult {
    total: number;
    surveys: SurveyImpl[];
}