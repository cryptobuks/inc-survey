import { SurveyImpl } from "./survey-impl";

export class SurveyTakeState {
    survey: SurveyImpl;
    questionsNum: number;
    partKey: string = '';
    txData: string;
    isMetaTx: boolean;
}