import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { SurveyState } from 'src/app/models/survey-support';
import { SurveyService } from 'src/app/services/survey.service';
import { toAmount, toFormatBigNumber } from 'src/app/shared/helper';

@Component({
  selector: 'survey-list-item',
  templateUrl: './survey-list-item.component.html',
  styleUrls: ['./survey-list-item.component.css']
})
export class SurveyListItemComponent implements OnInit {

  @Input()
  survey: SurveyImpl;

  @Input()
  forOwner: boolean;

  @Output()
  onClick: EventEmitter<number> = new EventEmitter();

  rmngBudget: string;
  partsNum: number;

  rmngBudgetInterval: any;

  constructor(private surveyService: SurveyService) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy() {
    clearInterval(this.rmngBudgetInterval);
  }

  public get SurveyState() {
    return SurveyState;
  }

  getState(survey: SurveyImpl): SurveyState {
    return this.surveyService.getState(survey);
  }

  private setRemainingBudgetInterval() {
    clearInterval(this.rmngBudgetInterval);
    this.rmngBudgetInterval = setInterval(() => {
      this.setRemainingBudget();
    }, 30000);
  }

  private async setRemainingBudget() {
    this.rmngBudget = toFormatBigNumber(toAmount(await this.surveyService.remainingBudgetOf(this.survey.id)));
  }

  private async loadData() {
    await this.setRemainingBudget();

    if (this.forOwner) {
      this.partsNum = await this.surveyService.getParticipantsLength(this.survey.id);
    }

    this.setRemainingBudgetInterval();
  }
}
