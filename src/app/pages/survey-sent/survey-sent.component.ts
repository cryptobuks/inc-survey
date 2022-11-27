import { Component, ElementRef } from '@angular/core';
import { NotifType } from 'src/app/models/notif-type';
import { SurveyEditState } from 'src/app/models/survey-edit-state';
import { TxValue } from 'src/app/models/tx-value';
import { CURRENT_CHAIN } from 'src/app/shared/constants';
import { calcFeeTotal, printPage } from 'src/app/shared/helper';
import { BasePageComponent } from '../base-page.component';
declare var $: any;

@Component({
  selector: 'app-survey-sent',
  templateUrl: './survey-sent.component.html',
  styleUrls: ['./survey-sent.component.css']
})
export class SurveySentComponent extends BasePageComponent {

  readonly titleKey = "survey_status";

  state: SurveyEditState;
  txValues: TxValue[] = [];
  receipt: any;

  constructor(
    element: ElementRef
  ) {
    super(element);
    this.state = this.stateService.surveyEditState;
  }

  onInit() {
    if(!this.state?.txHash) {
      this.goDashboard();
      return;
    }

    this.setTitle(this.translateService.instant("survey_status") + " ´" + this.state.survey.title + "´");

    this.txValues = [
      {
        title: this.translateService.instant("gas_reserve"),
        value: this.state.survey.gasReserve
      },
      {
        title: this.translateService.instant("engine_rate"),
        value: calcFeeTotal(this.state.survey.budget, this.state.survey.reward, this.configProps.feeWei)
      }
    ];
  }

  onViewLoaded() {
    if (!this.state?.txHash) {
      return;
    }
  }

  onDestroy() {
    // remove state from service
    this.stateService.cleanSurveyEditState();
  }

  async onReceipt(receipt: any) {
    this.receipt = receipt;

    if (this.receipt.status) {
      const events = await this.engineContract.getPastEvents('OnSurveyAdded', { fromBlock: this.receipt.blockNumber, toBlock: this.receipt.blockNumber });
      this.state.survey.address = events[0].returnValues.surveyAddr;
      // Send notification to subscribers
      await this.utilService.triggerNotification(NotifType.NEW_SURVEY, {
        chainId: CURRENT_CHAIN,
        surveyAddr: this.state.survey.address
      });
    }
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  printDetails() {
    const keys = $('.survey-keys', this.element.nativeElement);
    const keysHeight = keys.height();
    keys.height('auto');

    printPage(this.element);

    keys.height(keysHeight);
  }
}
