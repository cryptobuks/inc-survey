import { Component, ElementRef } from '@angular/core';
import BigNumber from 'bignumber.js';
import { SurveyTakeState } from 'src/app/models/survey-take-state';
import { SurveyStateInfoService } from 'src/app/services/survey-state-info.service';
import { printPage } from 'src/app/shared/helper';
import { setBreadcrumbForDetails } from 'src/app/shared/menu';
import { BasePageComponent } from '../base-page.component';

@Component({
  selector: 'app-part-sent',
  templateUrl: './part-sent.component.html',
  styleUrls: ['./part-sent.component.css'],
  providers: [SurveyStateInfoService]
})
export class PartSentComponent extends BasePageComponent {

  readonly titleKey = "participation_status";

  state: SurveyTakeState;
  receipt: any;

  constructor(
    element: ElementRef,
    private surveyStateInfo: SurveyStateInfoService
  ) {
    super(element);
    this.state = this.stateService.surveyTakeState;
  }

  onInit() {
    if(!this.state?.txHash) {
      this.goDashboard();
      return;
    }

    this.setTitle(this.translateService.instant("participation_status") + " ´" + this.state.survey.title + "´");
    setBreadcrumbForDetails(this.router, this.state.survey.id, this.state.survey.title);
    this.loadSurveyStateInfo();
  }

  onViewLoaded() {
    if(!this.state?.txHash) {
      return;
    }
  }

  onDestroy() {
    // remove state from service
    this.stateService.cleanSurveyTakeState();
  }

  onReceipt(receipt: any) {
    this.receipt = receipt;
  }

  backToDetails() {
    this.router.navigate(['/surveys/' + this.state.survey.id]);
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  printDetails() {
    printPage(this.element);
  }

  private async loadSurveyStateInfo() {
    await this.surveyStateInfo.loadData(this.state.survey);
  }
}
