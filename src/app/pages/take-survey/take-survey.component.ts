import { Component, ElementRef, ViewChild } from '@angular/core';
import { SurveyImplComponent } from 'src/app/comps/survey-impl/survey-impl.component';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { SurveyState } from 'src/app/models/survey-support';
import { SurveyTakeState } from 'src/app/models/survey-take-state';
import { insertValidationError, isUUID, removeAppCover, setAppCover, shortAddress } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
import { CURRENT_CHAIN, NET_PARAMS } from 'src/app/shared/constants';
import { SurveyStateInfoService } from 'src/app/services/survey-state-info.service';
import { setBreadcrumbForDetails } from 'src/app/shared/menu';
import { FwdRequest } from 'src/app/models/fwd-request';
import { AbiDecoder } from 'src/app/shared/abi-decoder';

@Component({
  selector: 'app-take-survey',
  templateUrl: './take-survey.component.html',
  styleUrls: ['./take-survey.component.css'],
  providers: [SurveyStateInfoService]
})
export class TakeSurveyComponent extends BasePageComponent {

  readonly titleKey = "take_survey";

  state: SurveyTakeState;
  survey: SurveyImpl;
  request: FwdRequest;
  decodedData: string;

  loading = true;// waiting onDataLoaded
  sending = false;
  displaySigReqDialog = false;
  showDecodedData = false;
  enoughGasReserve: boolean;

  get sendLabel(): string {
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

    return this.translateService.instant("send_participation");
  }

  get forwarderName(): string {
    return 'INCForwarder';
  }

  get forwarderShortAddress(): string | null {
    return shortAddress(this.forwarderContract?._address);
  }

  @ViewChild('surveyComp')
  surveyComp: SurveyImplComponent;

  private onChainLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef,
    private surveyStateInfo: SurveyStateInfoService
  ) {
    super(element);
    this.state = this.stateService.surveyTakeState;

    if (!this.state) {
      this.state = this.stateService.createSurveyTakeState();
    }
  }

  onInit() {
    let surveyAddr = this.navState?.surveyAddr;

    if (this.state.survey && this.state.survey.address == surveyAddr) {
      this.survey = this.state.survey;
    }

    if (!surveyAddr && !this.survey) {
      this.backToList();
      return;
    }

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadSurveyData(surveyAddr);
    }, () => {
      return this.loadedChainData;
    });

    this.pushInfo(this.translateService.instant('dnot_provide_personal_data'));
  }

  onViewLoaded() {
  }

  onDestroy() {
    if (this.onChainLoadedRemover)
      this.onChainLoadedRemover();
  }

  backToList() {
    this.router.navigate(['/surveys']);
  }

  backToDetails() {
    this.router.navigate(['/surveys/' + this.survey.address]);
  }

  participate(event: Event) {
    if (this.enoughGasReserve) {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translateService.instant('how_do_send_transaction') + ' ' + 
                 this.translateService.instant('use_gas_reserve_left_by_owner_or_pay_gas'),
        icon: 'pi pi-question-circle',
        acceptLabel: this.translateService.instant('send_without_gas'),
        acceptButtonStyleClass: 'p-button-success',
        accept: () => {
          this.sendPart(true);
        },
        rejectLabel: this.translateService.instant('send_paying_gas'),
        rejectButtonStyleClass: 'p-button',
        reject: () => {
          this.sendPart(false);
        }
      });
    } else {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translateService.instant('not_enough_gas_reserve_to_assume_parts') + ' ' + 
                 this.translateService.instant('to_participate_must_send_from_your_account'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.sendPart(false);
        },
        reject: () => {
        }
      });
    }
  }

  private async sendPart(useMetaTx: boolean) {
    this.sending = true;

    try {
      setAppCover(this.translateService.instant("please_wait"));

      if(this.survey.keyRequired) {
        if (!this.state.partKey) {
          insertValidationError('.part-key-cnt', this.translateService.instant("enter_participation_coupon"));
          return;
        }
  
        if (!isUUID(this.state.partKey)) {
          insertValidationError('.part-key-cnt', this.translateService.instant("invalid_participation_coupon"));
          return;
        }
      }

      const isValid = this.surveyComp.validateParticipation();
      if(!isValid) {
        return;
      }

      const surveyAddr = this.survey.address;
      const responses = this.surveyComp.getResponses();

      setAppCover(this.translateService.instant("waiting_reply"));

      if (useMetaTx) {
        this.request = await this.surveyService.estimatePartFromForwarder(CURRENT_CHAIN, surveyAddr, responses, this.state.partKey);

        const abiDecoder = new AbiDecoder(this.web3.eth.abi);
        abiDecoder.addABI(this.engineContract._jsonInterface);
        const decoded = abiDecoder.decodeMethod(this.request.data);
        this.decodedData = JSON.stringify(decoded, null, 2);

        this.displaySigReqDialog = true;
      } else {
        const txHash = await this.surveyService.sendParticipation(surveyAddr, responses, this.state.partKey);

        setAppCover(this.translateService.instant("please_wait"));
        this.finishPart(txHash, false);
      }

    } catch (err: any) {
      this.messageHelperService.showTxError(err);
    } finally {
      removeAppCover();
      this.sending = false;
    }
  }

  async signPart() {
    this.sending = true;
    this.displaySigReqDialog = false;

    try {
      setAppCover(this.translateService.instant("waiting_reply"));

      const signature = await this.surveyService.signTypedData(this.request);
      const messageId = await this.surveyService.sendPartFromForwarder(CURRENT_CHAIN, this.request, signature);

      setAppCover(this.translateService.instant("please_wait"));

      this.finishPart(messageId, true);

    } catch (err: any) {
      this.messageHelperService.showTxError(err);
    } finally {
      removeAppCover();
      this.request = undefined;
      this.decodedData = undefined;
      this.sending = false;
    }
  }

  private async finishPart(txData: string, isMetaTx: boolean) {
    if (!txData) {
      throw new Error("Inconsistency, no transaction data.");
    }

    this.state.txData = txData;
    this.state.isMetaTx = isMetaTx;
    this.survey.questions = undefined;
    this.router.navigate(['/take-survey/status']);
  }

  private async checkGasReserve() {
    let gasReserve = this.surveyStateInfo.rmngGasReserve;
    let partPrice = await this.surveyService.calcPartPrice();
    this.enoughGasReserve = !gasReserve.isLessThan(partPrice);

    if(this.surveyStateInfo.isOpened && !this.surveyStateInfo.enoughBudget) {
      this.pushWarn(this.translateService.instant('no_more_parts_survey_not_have_budget'));
    }

    if(this.surveyStateInfo.isOpened && this.surveyStateInfo.enoughBudget && !this.enoughGasReserve) {
      this.pushWarn(this.translateService.instant('not_enough_gas_reserve_to_assume_parts'));
    }
  }

  private async loadSurveyData(surveyAddr: string) {
    this.loading = true;

    try {
      if (!this.survey) {
        this.survey = await this.surveyService.findSurvey(surveyAddr);

        // this should not happen with added validation
        if (!this.survey?.address) {
          this.backToList();
          return;
        }

        let questionsNum = await this.surveyService.getQuestionsLength(surveyAddr);
        // SurveyBase.questionMaxPerRequest = SurveyValidator.questionMaxPerSurvey
        this.survey.questions = await this.surveyService.getQuestions(surveyAddr, 0, questionsNum);

        for (let i = 0; i < this.survey.questions.length; i++) {
          this.survey.questions[i].validators = await this.surveyService.getValidators(surveyAddr, i);
        }

        this.state.survey = this.survey;
        this.state.questionsNum = questionsNum;
      } 
      // in a multi-chain future, if the chainId changes, the survey must be reloaded.
      else if(this.survey.tokenData.chainId != CURRENT_CHAIN) {
        this.backToList();
        return;
      }

      await this.surveyStateInfo.loadData(this.survey, this.checkGasReserve.bind(this));
      
      this.setTitle(this.translateService.instant("take_survey") + ": " + this.survey.title);
      setBreadcrumbForDetails(this.router, surveyAddr, this.survey.title);

      if(!this.utilService.retrieveTrustToken(CURRENT_CHAIN, this.survey.tokenData.address)) {
        const link = NET_PARAMS[CURRENT_CHAIN].blockExplorerUrls[0] + '/address/' + this.survey.tokenData.address + '#code';
        this.pushWarn(this.translateService.instant('warning_about_unknown_token', { val1: link }));
      }

    } catch (err: any) {
      console.error(err);
      this.backToList();
    } finally {
      this.loading = false;
    }
  }
}
