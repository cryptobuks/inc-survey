import { Component, ElementRef, ViewChild } from '@angular/core';
import BigNumber from 'bignumber.js';
import { SurveyImplComponent } from 'src/app/comps/survey-impl/survey-impl.component';
import { SurveyEditState } from 'src/app/models/survey-edit-state';
import { MAX_UINT256 } from 'src/app/shared/constants';
import { calcFeeTotal, calcGasMargin, insertValidationError, removeAppCover, setAppCover, toAmount, toFormatBigNumber } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';

@Component({
  selector: 'app-survey-preview',
  templateUrl: './survey-preview.component.html',
  styleUrls: ['./survey-preview.component.css']
})
export class SurveyPreviewComponent extends BasePageComponent {

  readonly titleKey = "survey_preview";

  state: SurveyEditState;

  loading = false;
  editing = false;
  testing = false;
  sending = false;
  
  allowance: BigNumber;
  gasReserve: string;
  engineRate: string;
  totalToPay: string;

  @ViewChild('surveyComp')
  surveyComp: SurveyImplComponent;

  private onChainLoadedRemover: ListenerRemover;
  private onAccountLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef
  ) {
    super(element);
    this.state = this.stateService.surveyEditState;
  }

  onInit() {
    if(!this.state?.validated) {
      this.editSurvey();
      return;
    }

    this.state.validated = false;
    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      let totalFee = calcFeeTotal(this.state.survey.budget, this.state.survey.reward, this.configProps.feeWei);

      let gasReserveAmount = toAmount(this.state.survey.gasReserve);
      let rateAmount = toAmount(totalFee);
      let totalAmount = toAmount(totalFee.plus(this.state.survey.gasReserve));

      this.gasReserve = toFormatBigNumber(gasReserveAmount);
      this.engineRate = toFormatBigNumber(rateAmount);
      this.totalToPay = toFormatBigNumber(totalAmount);

      this.loadAllowance();
    }, () => {
      return this.loadedChainData;
    });

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.loadAllowance();
    });

    this.pushInfo(this.translateService.instant('test_survey_before_submitting_to_blockchain'));
  }

  onViewLoaded() {
  }

  onDestroy() {
    if(this.onChainLoadedRemover)
    this.onChainLoadedRemover();

    if(this.onAccountLoadedRemover)
    this.onAccountLoadedRemover();
  }

  editSurvey() {
    this.router.navigate(['/create-survey']);
  }

  testSurvey() {
    this.loading = true;
    this.testing = true;

    try {
      const isValid = this.surveyComp.validateParticipation();
      if(!isValid) {
        return;
      }
  
      this.messageHelperService.showInfo(this.translateService.instant("data_entered_is_correct"));
    } finally {
      this.loading = false;
      this.testing = false;
    }
  }

  confirmSurvey(event: Event) {
    if(this.hasAllowance()) {
      this.sendSurvey();
      return;
    }

    this.confirmationService.confirm({
        target: event.target,
        message: this.translateService.instant('first_time_two_transactions_x_executed', { val1: this.state.survey.tokenData.symbol }),
        icon: 'pi pi-exclamation-circle',
        accept: () => {
          this.sendSurvey();
        },
        reject: () => {
        }
    });
  }

  hasAllowance() {
    return this.allowance && this.allowance.isGreaterThanOrEqualTo(this.state.survey.budget);
  }

  private async sendSurvey() {
    this.loading = true;
    this.sending = true;

    try {
      setAppCover(this.translateService.instant("please_wait"));
      
      const isValid = this.surveyComp.validateSurvey();
      if(!isValid) {
        return;
      }

      // create logo URL & upload image if has imageData
      let hasImageToUpload = !this.state.survey.logoUrl && this.state.survey.imageData;

      if(hasImageToUpload) {
        try {
          let cid = await this.ipfsService.add(this.state.survey.imageData);

          if(!cid) {
            throw new Error("ipfs cid not found");
          }

          this.state.survey.logoUrl = "ipfs://" + cid;
          //this.state.survey.imageData = await this.ipfsService.ipfsImage(this.state.survey.logoUrl);
          this.state.survey.imageData = this.state.survey.logoUrl;
        } catch(err) {
          insertValidationError('.survey-logo', this.translateService.instant('image_not_loaded_try_again_later'));
          throw err;
        }
      }

      setAppCover(this.translateService.instant("waiting_reply"));
      let success = true;

      await this.loadAllowance();

      if(!this.hasAllowance()) {
        //let gasLimit = await tokenCnt.methods.approve(this.engineContract._address, MAX_UINT256).estimateGas({ from: this.accountData.address, gas: 5000000 });
        let tokenCnt = await this.web3Service.getERC20Contract(this.state.survey.tokenData.address);
        let data = tokenCnt.methods.approve(this.engineContract._address, MAX_UINT256).encodeABI();
        let estimatedGas = await this.web3Service.estimateGas(this.accountData.address, tokenCnt._address, data);
        let gasLimit = calcGasMargin(estimatedGas, 30);
        success = await tokenCnt.methods.approve(this.engineContract._address, MAX_UINT256).send({ from: this.accountData.address, gasLimit: gasLimit });
      }

      let txHash: string;

      if(success) {
        txHash = await this.surveyService.sendSurvey(this.state.survey);
      }

      setAppCover(this.translateService.instant("please_wait"));

      if (txHash) {
        this.state.txHash = txHash;
        this.router.navigate(['/create-survey/status']);
      }
    } catch (err: any) {
      this.messageHelperService.showTxError(err);
    } finally {
      removeAppCover();
      this.loading = false;
      this.sending = false;
    }
  }

  private async loadAllowance() {
    this.allowance = await this.web3Service.getERC20Allowance(this.state.survey.tokenData.address, this.accountData.address, this.engineContract._address);
  }
}
