import { FilterSortItem } from "./filter-sort-item";

export interface SurveyFilter {
    cursor?: number;
    length?: number;
    search?: string;// Search in title or description
    onlyPublic?: boolean;// No coupon required
    minStartTime?: number;
    maxStartTime?: number;
    minEndTime?: number;
    maxEndTime?: number;
    minBudget?: string;
    minReward?: string;
    token?: string;
    surveyOwner?: string;
    addresses?: string[];
    fields?: string[];
    sortItems: FilterSortItem[];
}