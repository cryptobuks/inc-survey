import { Component, ElementRef, ViewChild } from '@angular/core';
import { SurveyImplComponent } from 'src/app/comps/survey-impl/survey-impl.component';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { SurveyState } from 'src/app/models/survey-support';
import { SurveyTakeState } from 'src/app/models/survey-take-state';
import { insertValidationError, isUUID, removeAppCover, setAppCover, shortAddress } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
import { CURRENT_CHAIN } from 'src/app/shared/constants';
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
  captchaUrl: string;
  captcha: string;

  loading = true;// waiting onDataLoaded
  sending = false;
  generatingCaptcha = false;
  displayCaptchaDialog = false;
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
    let surveyId = this.navState?.surveyId;

    if (this.state.survey && this.state.survey.id == surveyId) {
      this.survey = this.state.survey;
    }

    if (!surveyId && !this.survey) {
      this.backToList();
      return;
    }

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadSurveyData(surveyId);
    }, () => {
      return this.loadedChainData;
    });
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
    this.router.navigate(['/surveys/' + this.survey.id]);
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

      const validation = this.surveyComp.validateParticipation();

      if (validation) {
        let elemId = validation[0];
        let errMsg = validation[1];
        let qIndex = validation[2];

        this.surveyComp.validationError(elemId, errMsg, qIndex);
        return;
      }

      if (useMetaTx) {
        this.genCaptchaUrl();
        this.displayCaptchaDialog = true;
      } else {
        const surveyId = this.survey.id;
        const responses = this.surveyComp.getResponses();

        setAppCover(this.translateService.instant("waiting_reply"));
        const txHash = await this.surveyService.sendParticipation(surveyId, responses, this.state.partKey);
        
        setAppCover(this.translateService.instant("please_wait"));
        this.finishPart(txHash, false);
      }

    } catch (err: any) {
      this.showTxError(err);
    } finally {
      removeAppCover();
      this.sending = false;
    }
  }

  async genCaptchaUrl() {
    this.generatingCaptcha = true;
    this.captcha = undefined;

    try {
      this.captchaUrl = await this.utilService.getCaptchaUrl(CURRENT_CHAIN);
    } finally {
      this.generatingCaptcha = false;
    }
  }

  async sendMetaTx() {
    this.sending = true;

    try {
      setAppCover(this.translateService.instant("please_wait"));

      if (!this.captcha) {
        insertValidationError('.captcha-cnt', this.translateService.instant("enter_captcha"));
        return;
      }

      this.displayCaptchaDialog = false;

      const surveyId = this.survey.id;
      const responses = this.surveyComp.getResponses();
      this.request = await this.surveyService.estimatePartFromForwarder(CURRENT_CHAIN, surveyId, responses, this.state.partKey, this.captcha);

      const abiDecoder = new AbiDecoder(this.web3.eth.abi);
      abiDecoder.addABI(this.engineContract._jsonInterface);
      const decoded = abiDecoder.decodeMethod(this.request.data);
      this.decodedData = JSON.stringify(decoded, null, 2);

      this.displaySigReqDialog = true;
    } catch (err: any) {
      this.showTxError(err);
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
      //console.log('TYPED SIGNED: ' + signature);

      setAppCover(this.translateService.instant("please_wait"));
  
      const txHash = await this.surveyService.sendPartFromForwarder(CURRENT_CHAIN, this.request, signature, this.captcha);
      this.finishPart(txHash, true);

    } catch (err: any) {
      this.showTxError(err);
    } finally {
      removeAppCover();
      this.request = undefined;
      this.decodedData = undefined;
      this.sending = false;
    }
  }

  private async finishPart(txHash: string, isMetaTx: boolean) {
    if (!txHash) {
      throw new Error("Inconsistency, no transaction hash.");
    }

    //console.log('txHash: ' + JSON.stringify(txHash));
    //await this.web3Service.loadAccountData(false);

    this.state.txHash = txHash;
    this.state.isMetaTx = isMetaTx;
    this.survey.questions = undefined;
    this.router.navigate(['/take-survey/status']);
  }

  private async checkGasReserve() {
    let gasReserve = this.surveyStateInfo.rmngGasReserve;
    let partPrice = await this.surveyService.calcPartPrice();
    this.enoughGasReserve = !gasReserve.isLessThan(partPrice);
  }

  private async loadSurveyData(surveyId: number) {
    this.loading = true;

    try {
      if (!this.survey) {
        this.survey = await this.surveyService.findSurvey(surveyId);

        // this should not happen with added validation
        if (!this.survey || this.survey.id == 0) {
          this.backToList();
          return;
        }

        let questionsNum = await this.surveyService.getQuestionsLength(surveyId);
        // SurveyBase.questionMaxPerRequest = SurveyValidator.questionMaxPerSurvey
        this.survey.questions = await this.surveyService.getQuestions(surveyId, 0, questionsNum);

        for (let i = 0; i < this.survey.questions.length; i++) {
          this.survey.questions[i].validators = await this.surveyService.getValidators(surveyId, i);
        }

        this.state.survey = this.survey;
        this.state.questionsNum = questionsNum;
      }

      await this.surveyStateInfo.loadData(this.survey, this.checkGasReserve.bind(this));
      
      this.setTitle(this.translateService.instant("take_survey") + ": " + this.survey.title);
      setBreadcrumbForDetails(this.router, surveyId, this.survey.title);

    } catch (err: any) {
      console.error(err);
      this.backToList();
    } finally {
      this.loading = false;
    }
  }
}
