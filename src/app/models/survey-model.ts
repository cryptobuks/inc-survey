import BigNumber from "bignumber.js";

export interface ConfigProps {
    // Query
    surveyMaxPerRequest: number;
    questionMaxPerRequest: number;
    responseMaxPerRequest: number;
    participantMaxPerRequest: number;
    participationMaxPerRequest: number;
    txGasMaxPerRequest: number;
    // Validator
    tknSymbolMaxLength: number;
    tknNameMaxLength: number;
    titleMaxLength: number;
    descriptionMaxLength: number;
    urlMaxLength: number;
    startMaxTime: number;// maximum time to start the survey
    rangeMinTime: number;// minimum duration time
    rangeMaxTime: number;// maximum duration time
    questionMaxPerSurvey: number;
    questionMaxLength: number;
    validatorMaxPerQuestion: number;
    validatorValueMaxLength: number;
    hashMaxPerSurvey: number;
    responseMaxLength: number;
    feeWei: BigNumber;
}

// ArrayText elements should not contain the separator (;)
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

export interface SurveyRequest {
    title: string;
    description: string;
    logoUrl: string;
    startTime: number;
    endTime: number;
    budget: string;// BigNumber: Total budget of tokens
    reward: string;// BigNumber: Reward amount for participation
    token: string;// Address: Incentive token
}

export interface Survey extends SurveyRequest {
    entryTime: number;
    account: string;// Address: creator
    keyRequired: boolean;
    addr: string;// Address: survey
}

export interface Participation {
    surveyAddr: string;
    responses: string[];
    txGas: string;// BigNumber
    entryTime: number;
    gasPrice: string;// BigNumber
    account: string;// Address
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

export interface ResponseCount {
    value: string;
    count: number;
}

export interface SurveyAmounts {
    remainingBudget: BigNumber;
    remainingGasReserve: BigNumber;
    participantNumber: number;
}
