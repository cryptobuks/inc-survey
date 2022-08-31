import { Injectable, OnDestroy } from '@angular/core';
import BigNumber from 'bignumber.js';
import { SurveyImpl } from '../models/survey-impl';
import { SurveyState } from '../models/survey-support';
import { formatDuration, toAmount, toFormatBigNumber } from '../shared/helper';
import { ListenerRemover } from '../shared/simple-listener';
import { SurveyService } from './survey.service';
import { Web3Service } from './web3.service';

@Injectable({
  providedIn: 'root'
})
export class SurveyStateInfoService implements OnDestroy {

  survey: SurveyImpl;
  onBudgetInterval: () => void;

  get isOpened(): boolean {
    return this.getState() == SurveyState.OPENED;
  }

  get isClosed(): boolean {
    return this.getState() == SurveyState.CLOSED;
  }

  get isPending(): boolean {
    return this.getState() == SurveyState.PENDING;
  }

  get canParticipate(): boolean {
    return !this.alreadyParticipated && this.enoughBudget && this.isOpened;
  }

  rmngTimeInterval: any;
  rmngTimeValue: number;
  rmngDuration: string;

  rmngBudgetInterval: any;
  partsNum: number;
  rmngBudget: BigNumber;
  rmngGasReserve: BigNumber;
  alreadyParticipated: boolean;

  rmngBudgetAmount: string;
  rmngGasReserveAmount: string;
  enoughBudget: boolean; // is enough budget to participate

  private onAccountLoadedRemover: ListenerRemover;

  constructor(
    private web3Service: Web3Service,
    private surveyService: SurveyService
  ) { 
    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      if(this.survey) {
        this.setRemainingBudget();
      }
    });
  }

  ngOnDestroy() {
    this.onAccountLoadedRemover();
    clearInterval(this.rmngTimeInterval);
    clearInterval(this.rmngBudgetInterval);
  }

  async loadData(survey: SurveyImpl, onBudgetInterval: () => void = undefined) {
    this.survey = survey;
    this.onBudgetInterval = onBudgetInterval;

    await this.setRemainingBudget();

    if (this.isOpened) {
      this.setRemainingTime();
      this.setRemainingTimeInterval();
      this.setRemainingBudgetInterval();
    } else {
      this.rmngDuration = '-';
    }
  }

  getState(): SurveyState {
    return this.surveyService.getState(this.survey);
  }

  private setRemainingTimeInterval() {
    clearInterval(this.rmngTimeInterval);
    this.rmngTimeInterval = setInterval(() => {
      this.setRemainingTime();
    }, 1000);
  }

  private setRemainingTime() {
    if (!this.rmngTimeValue) {
      this.rmngTimeValue = this.survey.endDate.getTime() - this.web3Service.currenTime;
    } else {
      this.rmngTimeValue -= 1000;
    }

    if (this.rmngTimeValue < 0) {
      this.rmngTimeValue = 0;
    }

    this.rmngDuration = formatDuration(this.rmngTimeValue);

    if (this.rmngTimeValue == 0) {
      clearInterval(this.rmngTimeInterval);
    }
  }

  private setRemainingBudgetInterval() {
    clearInterval(this.rmngBudgetInterval);
    this.rmngBudgetInterval = setInterval(() => {
      this.setRemainingBudget();
    }, 30000);
  }

  private async setRemainingBudget() {
    this.partsNum = await this.surveyService.getParticipantsLength(this.survey.id);
    this.rmngBudget = await this.surveyService.remainingBudgetOf(this.survey.id);
    this.rmngGasReserve = await this.surveyService.gasReserveOf(this.survey.id);
    this.alreadyParticipated = await this.surveyService.isUserParticipant(this.survey.id);

    this.rmngBudgetAmount = toFormatBigNumber(toAmount(this.rmngBudget));
    this.rmngGasReserveAmount = toFormatBigNumber(toAmount(this.rmngGasReserve));
    this.enoughBudget = !this.rmngBudget.isLessThan(this.survey.reward);

    if (!this.enoughBudget) {
      clearInterval(this.rmngBudgetInterval);
    }

    if (this.onBudgetInterval)
      this.onBudgetInterval();
  }
}
