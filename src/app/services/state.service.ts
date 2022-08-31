import { Injectable, OnDestroy } from '@angular/core';
import BigNumber from 'bignumber.js';
import { SurveyEditState } from '../models/survey-edit-state';
import { SurveyListState } from '../models/survey-list-state';
import { SurveyTakeState } from '../models/survey-take-state';
import { DAY_MILLIS } from '../shared/constants';
import { truncateSeconds } from '../shared/helper';

@Injectable({
  providedIn: 'root'
})
export class StateService implements OnDestroy {

  get surveyListState(): SurveyListState { return this._surveyListState; };
  private _surveyListState: SurveyListState;

  get surveyEditState(): SurveyEditState { return this._surveyEditState; };
  private _surveyEditState: SurveyEditState;

  get surveyTakeState(): SurveyTakeState { return this._surveyTakeState; };
  private _surveyTakeState: SurveyTakeState;

  constructor() {
  }

  ngOnDestroy() {
    console.log('StateService destroyed.');
  }

  createSurvey() {
    let startTimeMs = truncateSeconds(new Date()).getTime() + DAY_MILLIS;
    let endTimeMs = startTimeMs + DAY_MILLIS * 7;
    let budgetAmount = 100000 * 10 ** 18;
    let rewardAmount = 1000 * 10 ** 18;

    return {
      id: undefined,
      entryDate: undefined,
      title: undefined,
      description: undefined,
      logoUrl: undefined,
      startDate: new Date(startTimeMs),
      endDate: new Date(endTimeMs),
      budget: new BigNumber(budgetAmount),
      reward: new BigNumber(rewardAmount),
      questions: [],
      partKeys: []
    };
  }

  createSurveyListState() {
    this._surveyListState = new SurveyListState();
    return this.surveyListState;
  }

  createSurveyEditState() {
    this._surveyEditState = new SurveyEditState();
    this.surveyEditState.survey = this.createSurvey();
    return this.surveyEditState;
  }

  cleanSurveyEditState() {
    this._surveyEditState = undefined;
  }

  createSurveyTakeState() {
    this._surveyTakeState = new SurveyTakeState();
    return this.surveyTakeState;
  }

  cleanSurveyTakeState() {
    this._surveyTakeState = undefined;
  }
}
