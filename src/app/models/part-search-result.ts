import { SurveyImpl } from "./survey-impl";
import { Participation } from "./survey-model";

export interface PartSearchResult {
    total: number;
    parts?: Participation[];
    buckets?: PartBucket[];
    surveys?: SurveyImpl[];
}

export interface PartBucket {
    key: string;
    count: number;
    timeline?: PartTimeline;
}

export interface PartTimeline {
    times: number[];
    values: number[];
}
