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
  onAmountsLoaded: () => void;

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

  timeInterval: any;
  rmngTimeValue: number;
  rmngDuration: string;

  amountsInterval: any;
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
        this.loadAmounts();
      }
    });
  }

  ngOnDestroy() {
    this.onAccountLoadedRemover();
    clearInterval(this.timeInterval);
    clearInterval(this.amountsInterval);
  }

  async loadData(survey: SurveyImpl, onAmountsLoaded: () => void = undefined) {
    this.survey = survey;
    this.onAmountsLoaded = onAmountsLoaded;

    await this.loadAmounts();

    if (this.isOpened) {
      this.setRemainingTime();
      this.setTimeInterval();
      this.setAmountsInterval();
    } else {
      this.rmngDuration = '-';
    }
  }

  getState(): SurveyState {
    return this.surveyService.getState(this.survey);
  }

  private setTimeInterval() {
    clearInterval(this.timeInterval);
    this.timeInterval = setInterval(() => {
      this.setRemainingTime();
    }, 1000);
  }

  private setRemainingTime() {
    if (!this.rmngTimeValue) {
      this.rmngTimeValue = this.survey.endDate.getTime() - this.web3Service.currenTime - 1000;
    } else {
      this.rmngTimeValue -= 1000;
    }

    if (this.rmngTimeValue < 0) {
      this.rmngTimeValue = 0;
    }

    this.rmngDuration = formatDuration(this.rmngTimeValue);

    if (this.rmngTimeValue == 0) {
      clearInterval(this.timeInterval);
    }
  }

  private setAmountsInterval() {
    clearInterval(this.amountsInterval);
    this.amountsInterval = setInterval(() => {
      this.loadAmounts();
    }, 30000);
  }

  private async loadAmounts() {
    const amounts = await this.surveyService.amountsOf(this.survey.address);
    this.rmngBudget = amounts.remainingBudget;
    this.rmngGasReserve = amounts.remainingGasReserve;
    this.partsNum = amounts.participantNumber;
    this.alreadyParticipated = await this.surveyService.isUserParticipant(this.survey.address);

    this.rmngBudgetAmount = toFormatBigNumber(toAmount(this.rmngBudget, this.survey.tokenData.decimals));
    this.rmngGasReserveAmount = toFormatBigNumber(toAmount(this.rmngGasReserve));
    this.enoughBudget = !this.rmngBudget.isLessThan(this.survey.reward);

    if (!this.enoughBudget) {
      clearInterval(this.amountsInterval);
    }

    if (this.onAmountsLoaded)
      this.onAmountsLoaded();
  }
}
