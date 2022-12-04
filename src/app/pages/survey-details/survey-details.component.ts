import { Component, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import BigNumber from 'bignumber.js';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { SurveyState } from 'src/app/models/survey-support';
import { SurveyStateInfoService } from 'src/app/services/survey-state-info.service';
import { calcGasReserve, equalsIgnoreCase, insertValidationError, removeAppCover, setAppCover, toAmount, toFixedBigNumber, toFormatBigNumber, toUnits } from 'src/app/shared/helper';
import { isRouteFromDashboardMyParts, isRouteFromDashboardMySurveys, setBreadcrumbForDetails } from 'src/app/shared/menu';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';

@Component({
  selector: 'app-survey-details',
  templateUrl: './survey-details.component.html',
  styleUrls: ['./survey-details.component.css'],
  providers: [SurveyStateInfoService]
})
export class SurveyDetailsComponent extends BasePageComponent {

  readonly titleKey = "survey_details";

  survey: SurveyImpl;
  partPrice: BigNumber;
  questionsNum: number;
  isFromMySurveys: boolean;
  isFromMyParts: boolean;

  loading = true;// waiting onDataLoaded
  solving = false;
  increasing = false;
  displayIncreaseDialog = false;
  gasReserveAmount: string;

  get backLabel(): string {
    if(this.isFromMyParts) {
      return this.translateService.instant("back_to_my_answers");
    }

    return this.translateService.instant("back_to_survey_list");
  }

  get answersLabel(): string {
    if (this.surveyStateInfo.partsNum == 0) {
      return this.translateService.instant("no_answers");
    }

    if(this.isFromMyParts) {
      return this.translateService.instant("see_all_answers");
    }

    return this.translateService.instant("see_answers");
  }

  get takeLabel(): string {
    let surveyState = this.surveyStateInfo.getState();

    if (surveyState == SurveyState.CLOSED) {
      return this.translateService.instant("closed_survey");
    }

    if (surveyState == SurveyState.PENDING) {
      return this.translateService.instant("pending_survey");
    }

    if (!this.surveyStateInfo.enoughBudget) {
      return this.translateService.instant("no_budget_survey");
    }

    if (this.surveyStateInfo.alreadyParticipated) {
      return this.translateService.instant("already_participated");
    }

    return this.translateService.instant("take_survey");
  }

  get increaseLabel(): string {
    if(!this.isLowRmngGasReserve) {
      return this.translateService.instant("sufficient_gas_reserve");
    }

    return this.translateService.instant("increase_gas_reserve");
  }

  get newGasReserve(): BigNumber {
    return calcGasReserve(this.surveyStateInfo.rmngBudget, this.survey?.reward, this.partPrice);
  }

  get lackGasReserve(): BigNumber {
    return this.newGasReserve.minus(this.surveyStateInfo.rmngGasReserve);
  }

  get isSurveyOwner(): boolean {
    return equalsIgnoreCase(this.accountData.address, this.survey?.owner);
  }

  get isLowRmngGasReserve(): boolean {
    return this.surveyStateInfo.rmngGasReserve.isLessThan(this.newGasReserve);
  }

  get isLowInputGasReserve(): boolean {
    let gasReserve = toUnits(this.gasReserveAmount);
    return gasReserve.isNaN() || gasReserve.isLessThan(this.lackGasReserve);
  }

  get isValidInputGasReserve(): boolean {
    let gasReserve = toUnits(this.gasReserveAmount);
    return gasReserve.isGreaterThan(0);
  }

  get canSolveSurvey(): boolean {
    return this.isSurveyOwner &&
      (this.surveyStateInfo.rmngBudget.isGreaterThan(0) || this.surveyStateInfo.rmngGasReserve.isGreaterThan(0));
  }

  get canIncreaseGasReserve(): boolean {
    return this.isSurveyOwner && this.surveyStateInfo.isOpened && this.surveyStateInfo.rmngBudget.isGreaterThan(0) && this.isLowRmngGasReserve;
  }

  private onChainLoadedRemover: ListenerRemover;
  private onAccountLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef,
    private route: ActivatedRoute,
    private surveyStateInfo: SurveyStateInfoService
  ) {
    super(element);
  }

  onInit() {
    let surveyAddr = this.route.snapshot.paramMap.get('address');

    if (!surveyAddr) {
      this.backToList();
      return;
    }

    this.isFromMySurveys = isRouteFromDashboardMySurveys(this.router.url);
    this.isFromMyParts = isRouteFromDashboardMyParts(this.router.url);

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadSurveyData(surveyAddr);
    }, () => {
      return this.loadedChainData;
    });

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.checkOwnerRoute();
    });
  }

  onViewLoaded() {
  }

  onDestroy() {
    if (this.onChainLoadedRemover)
      this.onChainLoadedRemover();

    if (this.onAccountLoadedRemover)
      this.onAccountLoadedRemover();
  }

  onChangeGasReserve() {
  }

  checkOwnerRoute() {
    if(this.isFromMySurveys && !this.isSurveyOwner) {
      this.router.navigate(['/dashboard/my-surveys']);
      return false;
    }

    return true;
  }

  backToList() {
    if (this.isFromMySurveys) {
      this.router.navigate(['/dashboard/my-surveys']);
    } else if (this.isFromMyParts) {
      this.router.navigate(['/dashboard/my-parts']);
    } else {
      this.router.navigate(['/surveys']);
    }
  }

  seeAnswers() {
    if (this.isFromMySurveys) {
      this.router.navigate(['/dashboard/my-surveys/' + this.survey.address + '/answers']);
    } else if (this.isFromMyParts) {
      this.router.navigate(['/dashboard/my-parts/' + this.survey.address + '/answers']);
    } else {
      this.router.navigate(['/surveys/' + this.survey.address + '/answers']);
    }
  }

  takeSurvey() {
    this.router.navigate(['/take-survey'], {
      state: {
        surveyAddr: this.survey.address
      }
    });
  }

  solveSurvey(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translateService.instant('solve_survey_description') + '\n' + this.translateService.instant('want_to_continue'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.solveSurveyNow();
      },
      reject: () => {
      }
    });
  }

  async solveSurveyNow() {
    this.solving = true;

    try {
      setAppCover(this.translateService.instant("waiting_reply"));

      let tx = await this.surveyService.solveSurvey(this.survey.address);
      //console.log('tx:: ' + JSON.stringify(tx));

      setAppCover(this.translateService.instant("please_wait"));

      await this.web3Service.loadAccountBalance();
      await this.surveyStateInfo.loadData(this.survey, this.checkAlerts.bind(this));

      if (tx.events.OnSurveySolved.returnValues.budgetRefund > 0) {
        let budgetRefund = toFormatBigNumber(toAmount(tx.events.OnSurveySolved.returnValues.budgetRefund, this.survey.tokenData.decimals));
        this.messageHelperService.showSuccess(this.translateService.instant("for_remaining_budget_received_refund_x", { val1: budgetRefund + ' ' + this.survey.tokenData.symbol }));
      }

      if (tx.events.OnSurveySolved.returnValues.gasRefund > 0) {
        let gasRefund = toFormatBigNumber(toAmount(tx.events.OnSurveySolved.returnValues.gasRefund));
        this.messageHelperService.showSuccess(this.translateService.instant("for_gas_reserve_received_refund_x", { val1: gasRefund + ' ' + this.currSymbol }));
      }

    } catch (err: any) {
      this.messageHelperService.showTxError(err);
    } finally {
      removeAppCover();
      this.solving = false;
    }
  }

  loadGasReserve() {
    this.gasReserveAmount = toFixedBigNumber(toAmount(this.lackGasReserve));
  }

  async increaseGasReserve() {
    let weiAmount = toUnits(this.gasReserveAmount);

    if(weiAmount.isNaN() || weiAmount.isLessThan(0)) {
      insertValidationError(".survey-gas-reserve", this.translateService.instant("please_enter_valid_gas_reserve"));
      return;
    }

    if(weiAmount.isGreaterThan(this.accountData.ccyBalance)) {
      insertValidationError(".survey-gas-reserve", this.translateService.instant("gas_reserve_exceeds_your_x_balance", { val1: this.currSymbol }));
      return;
    }

    this.increasing = true;
    this.displayIncreaseDialog = false;

    try {
      setAppCover(this.translateService.instant("waiting_reply"));

      let tx = await this.surveyService.increaseGasReserve(this.survey.address, weiAmount);
      //console.log('tx:: ' + JSON.stringify(tx));

      setAppCover(this.translateService.instant("please_wait"));

      await this.web3Service.loadAccountBalance();
      await this.surveyStateInfo.loadData(this.survey, this.checkAlerts.bind(this));

      let gasAdded = toFormatBigNumber(toAmount(tx.events.OnGasReserveIncreased.returnValues.gasAdded));
      this.messageHelperService.showSuccess(this.translateService.instant("added_x_for_gas_reserve", { val1: gasAdded + ' ' + this.currSymbol }));

    } catch (err: any) {
      this.messageHelperService.showTxError(err);
    } finally {
      removeAppCover();
      this.increasing = false;
    }
  }

  private async loadSurveyData(surveyAddr: string) {
    this.loading = true;

    try {
      this.survey = await this.surveyService.findSurvey(surveyAddr);

      // this should not happen with added validation
      if (!this.survey?.address) {
        this.backToList();
        return;
      }

      if(!this.checkOwnerRoute()) {
        return;
      }

      this.partPrice = await this.surveyService.calcPartPrice();
      this.questionsNum = await this.surveyService.getQuestionsLength(surveyAddr);
      await this.surveyStateInfo.loadData(this.survey, this.checkAlerts.bind(this));

      setBreadcrumbForDetails(this.router, surveyAddr, this.survey.title);

    } catch (err: any) {
      console.error(err);
      this.backToList();
    } finally {
      this.loading = false;
    }
  }

  private async checkAlerts() {
    if(this.surveyStateInfo.isOpened && this.surveyStateInfo.enoughBudget && this.survey.keyRequired) {
      this.pushInfo(this.translateService.instant('survey_requires_coupon_participate'));
    }

    if(this.surveyStateInfo.isOpened && !this.surveyStateInfo.enoughBudget) {
      this.pushWarn(this.translateService.instant('no_more_parts_survey_not_have_budget'));
    }
  }
}
