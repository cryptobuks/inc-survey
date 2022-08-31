import BigNumber from "bignumber.js";

export interface SurveyProps {
    surveyMaxPerRequest: number;
    participantMaxPerRequest: number;
    participationMaxPerRequest: number;
    questionMaxPerRequest: number;
    responseMaxPerRequest: number;
}

export interface EngineProps {
    titleMaxLength: number;
    descriptionMaxLength: number;
    urlMaxLength: number;
    startMaxTime: number;
    rangeMinTime: number;
    rangeMaxTime: number;
    questionMaxPerSurvey: number;
    questionMaxLength: number;
    validatorMaxPerQuestion: number;
    validatorValueMaxLength: number;
    hashMaxPerSurvey: number;
    responseMaxLength: number;
    feeWei: BigNumber;
}

export enum ResponseType {
    Bool, Text, Number, Percent, Date, Rating, OneOption, 
    ManyOptions, Range, DateRange,
    ArrayBool, ArrayText, ArrayNumber, ArrayDate
}

export interface Question {
    content: string;// json that represents the content of the question - using QuestionContent
    mandatory: boolean;
    responseType: ResponseType;
}

export interface Survey {
    id: number;
    entryTime: number;
    title: string;
    description: string;
    logoUrl: string;
    startTime: number;
    endTime: number;
    budget: string;// BigNumber: Total budget of INC tokens
    reward: string;// BigNumber: Reward amount for participation
}

export interface Participation {
    surveyId: number;
    entryTime: number;
    responses: string[];
}

export interface SurveyData {
    owner: string;
    //participants: string[];
    remainingBudget: string;// BigNumber: Remaining budget
    gasReserve: string;// BigNumber: Gas reserve to pay participations
    //hashes: string[];// Participation hashes
    keyRequired: boolean;
}

export interface SurveyFilter {
    search: string;// Search in title or description
    onlyPublic: boolean;// No coupon required
    withRmngBudget: boolean;// With budget greater than or equal to the reward
    minStartTime: number;
    maxStartTime: number;
    minEndTime: number;
    maxEndTime: number;
    minBudget: string;// BigNumber
    minReward: string;// BigNumber
    minGasReserve: string;// BigNumber
}

export enum ValidationOperator {
    None, And, Or
}

export enum ValidationExpression {
    None,
    Empty,
    NotEmpty,
    Equals,
    NotEquals,
    Contains,
    NotContains,
    EqualsIgnoreCase,
    NotEqualsIgnoreCase,
    ContainsIgnoreCase,
    NotContainsIgnoreCase,
    Greater,
    GreaterEquals,
    Less,
    LessEquals,
    ContainsDigits,
    NotContainsDigits,
    MinLength,
    MaxLength
}

export interface QuestionValidator {
    questionIndex?: number;
    operator: ValidationOperator;
    expression: ValidationExpression;
    value: string;
}
