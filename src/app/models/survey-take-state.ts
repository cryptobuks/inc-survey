import { SurveyImpl } from "./survey-impl";

export class SurveyTakeState {
    survey: SurveyImpl;
    questionsNum: number;
    partKey: string = '';
    txHash: string;
    isMetaTx: boolean;
}