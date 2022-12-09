import { Type } from "@angular/core";
import { QuestionChecksComponent } from "../comps/question-checks/question-checks.component";
import { QuestionDateRangeComponent } from "../comps/question-date-range/question-date-range.component";
import { QuestionDateComponent } from "../comps/question-date/question-date.component";
import { QuestionDropdownComponent } from "../comps/question-dropdown/question-dropdown.component";
import { QuestionLinearScaleComponent } from "../comps/question-linear-scale/question-linear-scale.component";
import { QuestionOptionsComponent } from "../comps/question-options/question-options.component";
import { QuestionPercentComponent } from "../comps/question-percent/question-percent.component";
import { QuestionRangeComponent } from "../comps/question-range/question-range.component";
import { QuestionRatingComponent } from "../comps/question-rating/question-rating.component";
import { QuestionTextComponent } from "../comps/question-text/question-text.component";
import { QuestionToggleComponent } from "../comps/question-toggle/question-toggle.component";
import { ResponseChecksComponent } from "../comps/response-checks/response-checks.component";
import { ResponseDateRangeComponent } from "../comps/response-date-range/response-date-range.component";
import { ResponseDateComponent } from "../comps/response-date/response-date.component";
import { ResponseLinearScaleComponent } from "../comps/response-linear-scale/response-linear-scale.component";
import { ResponseOptionsComponent } from "../comps/response-options/response-options.component";
import { ResponsePercentComponent } from "../comps/response-percent/response-percent.component";
import { ResponseRangeComponent } from "../comps/response-range/response-range.component";
import { ResponseRatingComponent } from "../comps/response-rating/response-rating.component";
import { ResponseTextComponent } from "../comps/response-text/response-text.component";
import { ResponseToggleComponent } from "../comps/response-toggle/response-toggle.component";
import { isNumIn } from "../shared/helper";
import { QuestionImpl } from "./question-impl";
import { ResponseCount, ResponseType, ValidationExpression, ValidationOperator } from "./survey-model";

export enum ComponentType {
    TEXT_SINGLE_LINE, // ResponseType.Text
    TEXT_MULTI_LINE,  // ResponseType.Text
    OPTIONS,          // ResponseType.OneOption
    CHECKBOXES,       // ResponseType.ManyOptions
    DROPDOWN,         // ResponseType.OneOption
    LINEAR_SCALE,     // ResponseType.OneOption
    PERCENT,          // ResponseType.Percent
    RANGE,            // ResponseType.Range
    DATE,             // ResponseType.Date
    DATE_RANGE,       // ResponseType.DateRange
    RATING,           // ResponseType.Rating
    //RATINGS,          // ResponseType.ArrayRating
    TOGGLE,           // ResponseType.Bool
    //TOGGLES,          // ResponseType.ArrayBool
}

export enum ValidationValueType {
    None, Text, Number
}

export interface QuestionContent {
    title: string;
    description?: string;
    errorMessage?: string;
    componentType: ComponentType;
    componentData: any;
}

export interface MinifiedQuestionContent {
    t: string;// title
    d?: string;// description
    e?: string;// errorMessage
    ct: ComponentType;// componentType
    cd: any;// componentData
}

export interface ResponseHandler {
    input?: any;// User input
    output?:() => string;// Response to save
}

export interface QuestionData {
    content: any;
    state: any;
    mandatory: boolean; 
    response: ResponseHandler;
}

export interface ResponseData {
    question: QuestionImpl,
    partsNum: number,
    responses: string[],
    responseCounts: ResponseCount[],
    cursor: number,
    onLoaded: (count: number) => void;
}

export enum SurveyState {
    OPENED,
    CLOSED,
    PENDING
}

export const QUESTION_CLASS: { [type: number]: Type<any> } = {
    [ComponentType.TEXT_SINGLE_LINE]: QuestionTextComponent,
    [ComponentType.TEXT_MULTI_LINE]: QuestionTextComponent,
    [ComponentType.OPTIONS]: QuestionOptionsComponent,
    [ComponentType.CHECKBOXES]: QuestionChecksComponent,
    [ComponentType.DROPDOWN]: QuestionDropdownComponent,
    [ComponentType.LINEAR_SCALE]: QuestionLinearScaleComponent,
    [ComponentType.PERCENT]: QuestionPercentComponent,
    [ComponentType.RANGE]: QuestionRangeComponent,
    [ComponentType.DATE]: QuestionDateComponent,
    [ComponentType.DATE_RANGE]: QuestionDateRangeComponent,
    [ComponentType.RATING]: QuestionRatingComponent,
    //[ComponentType.RATINGS]: TestComponent,
    [ComponentType.TOGGLE]: QuestionToggleComponent,
    //[ComponentType.TOGGLES]: TestComponent
};

export const RESPONSE_CLASS: { [type: number]: Type<any> } = {
    [ComponentType.TEXT_SINGLE_LINE]: ResponseTextComponent,
    [ComponentType.TEXT_MULTI_LINE]: ResponseTextComponent,
    [ComponentType.OPTIONS]: ResponseOptionsComponent,
    [ComponentType.CHECKBOXES]: ResponseChecksComponent,
    [ComponentType.DROPDOWN]: ResponseOptionsComponent,// Using same comp.
    [ComponentType.LINEAR_SCALE]: ResponseLinearScaleComponent,
    [ComponentType.PERCENT]: ResponsePercentComponent,
    [ComponentType.RANGE]: ResponseRangeComponent,// ´count´ is not the total number of responses
    [ComponentType.DATE]: ResponseDateComponent,// ´count´ is not the total number of responses
    [ComponentType.DATE_RANGE]: ResponseDateRangeComponent,// ´count´ is not the total number of responses
    [ComponentType.RATING]: ResponseRatingComponent,
    //[ComponentType.RATINGS]: TestComponent,
    [ComponentType.TOGGLE]: ResponseToggleComponent,
    //[ComponentType.TOGGLES]: TestComponent
};

export const RESPONSE_TYPE: { [type: number]: ResponseType } = {
    [ComponentType.TEXT_SINGLE_LINE]: ResponseType.Text,
    [ComponentType.TEXT_MULTI_LINE]: ResponseType.Text,
    [ComponentType.OPTIONS]: ResponseType.OneOption,
    [ComponentType.CHECKBOXES]: ResponseType.ManyOptions,
    [ComponentType.DROPDOWN]: ResponseType.OneOption,
    [ComponentType.LINEAR_SCALE]: ResponseType.OneOption,
    [ComponentType.PERCENT]: ResponseType.Percent,
    [ComponentType.RANGE]: ResponseType.Range,
    [ComponentType.DATE]: ResponseType.Date,
    [ComponentType.DATE_RANGE]: ResponseType.DateRange,
    [ComponentType.RATING]: ResponseType.Rating,
    //[ComponentType.RATINGS]: ResponseType.ArrayRating,
    [ComponentType.TOGGLE]: ResponseType.Bool,
    //[ComponentType.TOGGLES]: ResponseType.ArrayBool
};

export const isLimitedResponse = (type: ResponseType) => {
    return isNumIn(type, 
        ResponseType.Bool, 
        ResponseType.Percent, 
        ResponseType.Rating, 
        ResponseType.OneOption, 
        ResponseType.ManyOptions, 
        ResponseType.ArrayBool);
};

export const isArrayResponse = (type: ResponseType) => {
    return isNumIn(type, 
        ResponseType.ManyOptions, 
        ResponseType.Range, 
        ResponseType.DateRange, 
        ResponseType.ArrayBool, 
        ResponseType.ArrayText, 
        ResponseType.ArrayNumber, 
        ResponseType.ArrayDate);
};

export const parseResponse = (type: ResponseType, response: string) => {
    let values: string[];

    if(isArrayResponse(type)) {
        values = response.split(";");
    } else {
        values = [response];
    }

    return values;
};

export const getValidationExpressions = (type: ResponseType) => {
    if (isNumIn(type, ResponseType.Text, ResponseType.ArrayText)) {
        return [
            //ValidationExpression.Empty,
            //ValidationExpression.NotEmpty,
            ValidationExpression.Equals,
            ValidationExpression.NotEquals,
            ValidationExpression.Contains,
            ValidationExpression.NotContains,
            ValidationExpression.EqualsIgnoreCase,
            ValidationExpression.NotEqualsIgnoreCase,
            ValidationExpression.ContainsIgnoreCase,
            ValidationExpression.NotContainsIgnoreCase,
            ValidationExpression.ContainsDigits,
            ValidationExpression.NotContainsDigits,
            ValidationExpression.MinLength,
            ValidationExpression.MaxLength
        ];
    } else if (isNumIn(type, ResponseType.Number, ResponseType.ArrayNumber, 
        ResponseType.Percent, ResponseType.Rating, 
        ResponseType.Date, ResponseType.ArrayDate, 
        ResponseType.Range, ResponseType.DateRange)) {
        return [
            ValidationExpression.Equals,
            ValidationExpression.NotEquals,
            ValidationExpression.Greater,
            ValidationExpression.GreaterEquals,
            ValidationExpression.Less,
            ValidationExpression.LessEquals
        ];
    }

    return [];
};

export const getExpressionTitle = (expression: ValidationExpression) => {
    switch (expression) {
        case ValidationExpression.Empty: return "empty";
        case ValidationExpression.NotEmpty: return "not_empty";
        case ValidationExpression.Equals: return "equals";
        case ValidationExpression.NotEquals: return "not_equals";
        case ValidationExpression.Contains: return "contains";
        case ValidationExpression.NotContains: return "not_contains";
        case ValidationExpression.EqualsIgnoreCase: return "equals_ignore_case";
        case ValidationExpression.NotEqualsIgnoreCase: return "not_equals_ignore_case";
        case ValidationExpression.ContainsIgnoreCase: return "contains_ignore_case";
        case ValidationExpression.NotContainsIgnoreCase: return "not_contains_ignore_case";
        case ValidationExpression.Greater: return "greater";
        case ValidationExpression.GreaterEquals: return "greater_equals";
        case ValidationExpression.Less: return "less";
        case ValidationExpression.LessEquals: return "less_equals";
        case ValidationExpression.ContainsDigits: return "contains_digits";
        case ValidationExpression.NotContainsDigits: return "not_contains_digits";
        case ValidationExpression.MinLength: return "min_length";
        case ValidationExpression.MaxLength: return "max_length";
        default: return null;
    }
};

export const getOperatorTitle = (operator: ValidationOperator) => {
    switch (operator) {
        case ValidationOperator.And: return "and";
        case ValidationOperator.Or: return "or";
        default: return null;
    }
};

export const getValueType = (expression: ValidationExpression) => {
    switch (expression) {
        case ValidationExpression.Equals:
        case ValidationExpression.NotEquals:
        case ValidationExpression.Contains:
        case ValidationExpression.NotContains:
        case ValidationExpression.EqualsIgnoreCase:
        case ValidationExpression.NotEqualsIgnoreCase:
        case ValidationExpression.ContainsIgnoreCase:
        case ValidationExpression.NotContainsIgnoreCase:
            return ValidationValueType.Text;
        case ValidationExpression.Greater:
        case ValidationExpression.GreaterEquals:
        case ValidationExpression.Less:
        case ValidationExpression.LessEquals:
        case ValidationExpression.MinLength:
        case ValidationExpression.MaxLength:
            return ValidationValueType.Number;
        default:
            return ValidationValueType.None;
    }
};

export const getInput = (type: ComponentType, str: string) => {
    switch (type) {
        case ComponentType.TEXT_SINGLE_LINE:
        case ComponentType.TEXT_MULTI_LINE: {
            return str;
        }
        case ComponentType.OPTIONS:
        case ComponentType.DROPDOWN:
        case ComponentType.LINEAR_SCALE:
        case ComponentType.PERCENT:
        case ComponentType.RATING: {
            return parseInt(str);
        }
        case ComponentType.CHECKBOXES: {
            let values = str.split(';');
            let input = [];

            for (let value of values) {
                input.push(parseInt(value));
            }

            return input;
        }
        case ComponentType.RANGE: {
            let values = str.split(';');
            return [
              parseInt(values[0]),
              parseInt(values[1]),
            ];
        }
        case ComponentType.DATE: {
            return new Date(parseInt(str) * 1000);
        }
        case ComponentType.DATE_RANGE: {
            let values = str.split(';');
            return [
              new Date(parseInt(values[0]) * 1000),
              new Date(parseInt(values[1]) * 1000),
            ];
        }
        case ComponentType.TOGGLE: {
            return (str == "true");
        }
        default: {
            return null;
        }
    }
};
