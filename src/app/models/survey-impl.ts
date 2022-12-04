import BigNumber from "bignumber.js";
import { toAmount, toFormatBigNumber } from "../shared/helper";
import { QuestionImpl } from "./question-impl";
import { Survey } from "./survey-model";
import { TokenData } from "./token-data";

export interface SurveyFormattedData {
  budgetAmount: string;
  rewardAmount: string;
  entryDate: string;
  startDate: string;
  endDate: string;
}

export class SurveyImpl {

    entryDate: Date;
    title: string;
    description: string;
    logoUrl: string;
    startDate: Date;
    endDate: Date;
    budget: BigNumber;
    reward: BigNumber;
    tokenData: TokenData;
    address?: string;
    owner?: string;
    keyRequired?: boolean;
    gasReserve?: BigNumber;
    imageData?: string;
    questions?: QuestionImpl[];
    partKeys?: string[];
    formatted?: SurveyFormattedData;
    
    static formatData(impl: SurveyImpl): SurveyFormattedData {
      impl.formatted = {
        budgetAmount: toFormatBigNumber(toAmount(impl.budget, impl.tokenData.decimals)),
        rewardAmount: toFormatBigNumber(toAmount(impl.reward, impl.tokenData.decimals)),
        entryDate: impl.entryDate?.toLocaleString(),
        startDate: impl.startDate.toLocaleString(),
        endDate: impl.endDate.toLocaleString()
      };

      return impl.formatted;
    }

    static toImpl(survey: Survey, tokenData: TokenData, questions: QuestionImpl[]): SurveyImpl {
      let impl: SurveyImpl = {
        address: survey.addr,
        owner: survey.account,
        entryDate: new Date(survey.entryTime * 1000),
        title: survey.title,
        description: survey.description,
        logoUrl: survey.logoUrl,
        startDate: new Date(survey.startTime * 1000),
        endDate: new Date(survey.endTime * 1000),
        budget: new BigNumber(survey.budget),
        reward: new BigNumber(survey.reward),
        keyRequired: survey.keyRequired,
        imageData: survey.logoUrl,
        tokenData,
        questions
      };

      SurveyImpl.formatData(impl);
      return impl;
    }
}
