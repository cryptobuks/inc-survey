import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { SurveyState } from 'src/app/models/survey-support';
import { SurveyService } from 'src/app/services/survey.service';
import { CURRENT_CHAIN, NATIVE_CURRENCY } from 'src/app/shared/constants';
import { toAmount, toFormatBigNumber } from 'src/app/shared/helper';

@Component({
  selector: 'survey-card',
  templateUrl: './survey-card.component.html',
  styleUrls: ['./survey-card.component.css']
})
export class SurveyCardComponent implements OnInit {

  @Input()
  survey: SurveyImpl;

  @Input()
  forOwner: boolean;

  @Output()
  onClick: EventEmitter<number> = new EventEmitter();

  get currSymbol(): string { return NATIVE_CURRENCY[CURRENT_CHAIN].symbol; }

  rmngBudget: string;
  rmngGasReserve: string;
  partsNum: number;

  amountsInterval: any;

  constructor(private surveyService: SurveyService) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy() {
    clearInterval(this.amountsInterval);
  }

  public get SurveyState() {
    return SurveyState;
  }

  getState(survey: SurveyImpl): SurveyState {
    return this.surveyService.getState(survey);
  }

  private setAmountsInterval() {
    clearInterval(this.amountsInterval);
    this.amountsInterval = setInterval(() => {
      this.loadAmounts();
    }, 30000);
  }

  private async loadAmounts() {
    const amounts = await this.surveyService.amountsOf(this.survey.address);
    this.rmngBudget = toFormatBigNumber(toAmount(amounts.remainingBudget, this.survey.tokenData.decimals));
    this.rmngGasReserve = toFormatBigNumber(toAmount(amounts.remainingGasReserve));
    this.partsNum = amounts.participantNumber;
  }

  private async loadData() {
    await this.loadAmounts();
    this.setAmountsInterval();
  }
}
