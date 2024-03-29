import { Component, ElementRef, ViewChild } from '@angular/core';
import { OwnPartsChartComponent } from 'src/app/comps/own-parts-chart/own-parts-chart.component';
import { OwnSurveysChartComponent } from 'src/app/comps/own-surveys-chart/own-surveys-chart.component';
import { SurveyTimelineComponent } from 'src/app/comps/survey-timeline/survey-timeline.component';
import { SurveyState } from 'src/app/models/survey-support';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent extends BasePageComponent {

  readonly titleKey = "dashboard";

  surveysLength: number;
  participationsLength: number;

  loading = false;

  private onChainLoadedRemover: ListenerRemover;
  private onAccountLoadedRemover: ListenerRemover;

  @ViewChild('surveyTimelineChart') surveyTimelineChart: SurveyTimelineComponent;
  @ViewChild('ownOpenedSurveysChart') ownOpenedSurveysChart: OwnSurveysChartComponent;
  @ViewChild('ownClosedSurveysChart') ownClosedSurveysChart: OwnSurveysChartComponent;
  @ViewChild('ownPartsChart') ownPartsChart: OwnPartsChartComponent;

  get SurveyState() {
    return SurveyState;
  }

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadAccountData();
    }, () => {
      return this.loadedChainData;
    });

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.loadAccountData();

      if(this.surveyTimelineChart) {
        this.surveyTimelineChart.loadDefault();
      }

      if(this.ownOpenedSurveysChart) {
        this.ownOpenedSurveysChart.loadData();
      }

      if(this.ownClosedSurveysChart) {
        this.ownClosedSurveysChart.loadData();
      }

      if(this.ownPartsChart) {
        this.ownPartsChart.loadData();
      }
    });
  }

  onViewLoaded() {
  }

  onDestroy() {
    this.onChainLoadedRemover();
    this.onAccountLoadedRemover();
  }

  checkSurveys() {
    this.router.navigate(['/dashboard/my-surveys']);
  }

  checkParticipations() {
    this.router.navigate(['/dashboard/my-parts']);
  }

  private async loadAccountData() {
    this.loading = true;

    try {
      this.surveysLength = await this.surveyService.getOwnSurveysLength();
      this.participationsLength = await this.surveyService.getOwnParticipationsLength();

    } catch (err: any) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
