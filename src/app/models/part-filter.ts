import { FilterSortItem } from "./filter-sort-item";

export interface PartFilter {
    cursor?: number;
    length?: number;
    startTime?: number;
    endTime?: number;
    granularity?: number;
    surveyMinStartTime?: number;
    surveyMaxStartTime?: number;
    surveyMinEndTime?: number;
    surveyMaxEndTime?: number;
    surveyAddr?: string;
    surveyOwner?: string;
    partOwner?: string;
    aggField?: string;
    surveyFields?: string[];
    sortItems?: FilterSortItem[];
}