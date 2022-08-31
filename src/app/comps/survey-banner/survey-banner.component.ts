import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { SurveyState } from 'src/app/models/survey-support';
import { SurveyStateInfoService } from 'src/app/services/survey-state-info.service';
import { SurveyService } from 'src/app/services/survey.service';

@Component({
  selector: 'survey-banner',
  templateUrl: './survey-banner.component.html',
  styleUrls: ['./survey-banner.component.css']
})
export class SurveyBannerComponent implements OnInit {

  @Input()
  survey: SurveyImpl;

  @Input()
  surveyStateInfo: SurveyStateInfoService;

  @Output()
  onClick: EventEmitter<any> = new EventEmitter();

  constructor(private surveyService: SurveyService) {}

  ngOnInit(): void {
  }

  public get SurveyState() {
    return SurveyState;
  }

  getState(survey: SurveyImpl): SurveyState {
    return this.surveyService.getState(survey);
  }
}
