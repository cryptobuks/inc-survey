import BigNumber from "bignumber.js";
import { toAmount, toFormatBigNumber } from "../shared/helper";
import { QuestionImpl } from "./question-impl";
import { Survey, SurveyData } from "./survey-model";

export interface SurveyFormattedData {
  budgetAmount: string;
  rewardAmount: string;
  entryDate: string;
  startDate: string;
  endDate: string;
}

export class SurveyImpl {

    id: number;
    entryDate: Date;
    title: string;
    description: string;
    logoUrl: string;
    startDate: Date;
    endDate: Date;
    budget: BigNumber;
    reward: BigNumber;
    owner?: string;
    remainingBudget?: BigNumber;// Avoid, change at any time
    gasReserve?: BigNumber;// Avoid, change at any time
    keyRequired?: boolean;
    partKeys?: string[];
    imageData?: string;
    formatted?: SurveyFormattedData;
    questions?: QuestionImpl[];
    
    static formatData(impl: SurveyImpl): SurveyFormattedData {
      impl.formatted = {
        budgetAmount: toFormatBigNumber(toAmount(impl.budget)),
        rewardAmount: toFormatBigNumber(toAmount(impl.reward)),
        entryDate: impl.entryDate?.toLocaleString(),
        startDate: impl.startDate.toLocaleString(),
        endDate: impl.endDate.toLocaleString()
      };

      return impl.formatted;
    }

    static toImpl(survey: Survey, surveyData: SurveyData, questions: QuestionImpl[]): SurveyImpl {
      let impl: SurveyImpl = {
        id: survey.id,
        entryDate: new Date(survey.entryTime * 1000),
        title: survey.title,
        description: survey.description,
        logoUrl: survey.logoUrl,
        startDate: new Date(survey.startTime * 1000),
        endDate: new Date(survey.endTime * 1000),
        budget: new BigNumber(survey.budget),
        reward: new BigNumber(survey.reward),
        owner: surveyData.owner,
        remainingBudget: new BigNumber(surveyData.remainingBudget),
        gasReserve: new BigNumber(surveyData.gasReserve),
        keyRequired: surveyData.keyRequired,
        questions: questions
      };

      SurveyImpl.formatData(impl);
      return impl;
    }
}
