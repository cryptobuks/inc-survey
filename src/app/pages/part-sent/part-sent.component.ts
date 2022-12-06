import { Component, ElementRef } from '@angular/core';
import { SurveyImpl } from 'src/app/models/survey-impl';
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
  survey: SurveyImpl;
  txHash: string;
  receipt: any;

  gettingHash: boolean;
  attemps = 0;

  constructor(
    element: ElementRef,
    private surveyStateInfo: SurveyStateInfoService
  ) {
    super(element);
    this.state = this.stateService.surveyTakeState;
  }

  onInit() {
    if (!this.state?.txData) {
      this.goDashboard();
      return;
    }

    this.survey = this.state.survey;
    this.setTitle(this.translateService.instant("participation_status") + " ´" + this.survey.title + "´");
    setBreadcrumbForDetails(this.router, this.survey.address, this.survey.title);
    this.loadSurveyStateInfo();

    if (this.state.isMetaTx) {
      this.gettingHash = true;
      this.getTxHash();
    } else {
      this.txHash = this.state.txData;
    }
  }

  onViewLoaded() {
    if (!this.state?.txData) {
      return;
    }
  }

  onDestroy() {
    // remove state from service
    this.stateService.cleanSurveyTakeState();
  }

  onReceipt(receipt: any) {
    this.receipt = receipt;
    if (receipt.status) {
      this.messageHelperService.showSuccess(this.translateService.instant(
        "check_balance_should_received_x",
        { val1: this.survey.formatted.rewardAmount + ' ' + this.survey.tokenData.symbol }
      ));
    }
  }

  backToDetails() {
    this.router.navigate(['/surveys/' + this.survey.address]);
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  printDetails() {
    printPage(this.element);
  }

  private async loadSurveyStateInfo() {
    await this.surveyStateInfo.loadData(this.survey);
  }

  private async getTxHash() {
    this.attemps++;
    const result = await this.utilService.getHash(this.state.txData);

    if (result.success) {
      this.gettingHash = false;
      this.txHash = result.data;
      return;
    }

    if(result.data != 'Relayer: no result') {
      this.gettingHash = false;
      this.messageHelperService.showTxError(new Error(result.data));
      return;
    }

    if(this.attemps >= 24) {
      this.gettingHash = false;
      this.messageHelperService.showWarn(this.translateService.instant('not_possible_obtain_tx_hash'));
      this.pushInfo(this.translateService.instant('if_relayer_processes_your_trade_later'));
      return;
    }

    setTimeout(() => {
      this.getTxHash();
    }, 5000);// Check again in 5 seconds
  }
}
