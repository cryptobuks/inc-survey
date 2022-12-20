import { Component, ElementRef } from '@angular/core';
import { NotifType } from 'src/app/models/notif-type';
import { SurveyEditState } from 'src/app/models/survey-edit-state';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { TxValue } from 'src/app/models/tx-value';
import { CURRENT_CHAIN } from 'src/app/shared/constants';
import { calcFeeTotal, keccak256, printPage } from 'src/app/shared/helper';
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
  survey: SurveyImpl;
  
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

    this.survey = this.state.survey;
    this.setTitle(this.translateService.instant("survey_status") + " ´" + this.survey.title + "´");

    this.txValues = [
      {
        title: this.translateService.instant("gas_reserve"),
        value: this.survey.gasReserve
      },
      {
        title: this.translateService.instant("engine_rate"),
        value: calcFeeTotal(this.survey.budget, this.survey.reward, this.configProps.feeWei)
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
      this.pushSuccess(this.translateService.instant('survey_on_blockchain_few_time_to_be_indexed'));

      for(let log of this.receipt.logs) {
        if(log.topics[0] == keccak256('OwnershipTransferred(address,address)')) {
          this.survey.address = log.address;
          break;
        }
      }

      // Send notification to subscribers
      await this.utilService.triggerNotification(NotifType.NEW_SURVEY, {
        chainId: CURRENT_CHAIN,
        surveyAddr: this.survey.address
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
