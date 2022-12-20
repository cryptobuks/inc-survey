import { Component, ElementRef, ViewChild } from '@angular/core';
import BigNumber from 'bignumber.js';
import { SurveyImplComponent } from 'src/app/comps/survey-impl/survey-impl.component';
import { SurveyEditState } from 'src/app/models/survey-edit-state';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { IpfsService } from 'src/app/services/ipfs.service';
import { CURRENT_CHAIN, MAX_UINT256 } from 'src/app/shared/constants';
import { calcFeeTotal, calcGasMargin, dataURIToBase64, insertValidationError, removeAppCover, setAppCover, toAmount, toFormatBigNumber } from 'src/app/shared/helper';
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
  survey: SurveyImpl;

  loading = false;
  editing = false;
  testing = false;
  sending = false;
  tested = false;
  
  allowance: BigNumber;
  gasReserve: string;
  engineRate: string;
  totalToPay: string;

  @ViewChild('surveyComp')
  surveyComp: SurveyImplComponent;

  private onChainLoadedRemover: ListenerRemover;
  private onAccountLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef,
    private ipfsService: IpfsService
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
    this.survey = this.state.survey;

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadChainData();
    }, () => {
      return this.loadedChainData;
    });

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.loadAllowance();
    });

    this.pushInfo(this.translateService.instant('test_survey_before_sending_to_blockchain'));
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
  
      this.tested = true;
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
        message: this.translateService.instant('first_time_two_transactions_x_executed', { val1: this.survey.tokenData.symbol }),
        icon: 'pi pi-exclamation-circle',
        accept: () => {
          this.sendSurvey();
        },
        reject: () => {
        }
    });
  }

  hasAllowance() {
    return this.allowance && this.allowance.isGreaterThanOrEqualTo(this.survey.budget);
  }

  private async loadChainData() {
    // in a multi-chain future, if the chainId changes, the survey must be edited again.
    if(this.survey.tokenData.chainId != CURRENT_CHAIN) {
      this.editSurvey();
      return;
    }
    
    let totalFee = calcFeeTotal(this.survey.budget, this.survey.reward, this.configProps.feeWei);

    let gasReserveAmount = toAmount(this.survey.gasReserve);
    let rateAmount = toAmount(totalFee);
    let totalAmount = toAmount(totalFee.plus(this.survey.gasReserve));

    this.gasReserve = toFormatBigNumber(gasReserveAmount);
    this.engineRate = toFormatBigNumber(rateAmount);
    this.totalToPay = toFormatBigNumber(totalAmount);

    await this.loadAllowance();
  }

  private async loadAllowance() {
    this.allowance = await this.web3Service.getERC20Allowance(this.survey.tokenData.address, this.accountData.address, this.engineContract._address);
  }

  private async sendSurvey() {
    this.loading = true;
    this.sending = true;

    try {
      setAppCover(this.translateService.instant("please_wait"));

      await this.web3Service.loadTokenBalance(this.survey.tokenData);
      const isValid = this.surveyComp.validateSurvey();
      
      if(!isValid) {
        return;
      }

      if(!this.tested) {
        this.messageHelperService.showWarn(this.translateService.instant('test_survey_before_sending'));
        return;
      }

      // create logo URL & upload image if has imageData
      const hasImageToUpload = !this.survey.logoUrl && this.survey.imageData?.startsWith("data:image/");
      let base64: string;

      if(hasImageToUpload) {
        try {
          base64 = dataURIToBase64(this.survey.imageData);
          const buf = Buffer.from(base64, "base64");
          const cid = await this.ipfsService.add(buf);
          this.survey.logoUrl = "ipfs://" + cid;
        } catch(err) {
          insertValidationError('.survey-logo', this.translateService.instant('failed_upload_survey_logo_try_again_later'));
          throw err;
        }
      }

      setAppCover(this.translateService.instant("waiting_reply"));
      let success = true;

      await this.loadAllowance();

      if(!this.hasAllowance()) {
        let tokenCnt = await this.web3Service.getERC20Contract(this.survey.tokenData.address);
        let data = tokenCnt.methods.approve(this.engineContract._address, MAX_UINT256).encodeABI();
        let estimatedGas = await this.web3Service.estimateGas(this.accountData.address, tokenCnt._address, data);
        // The gas limit is increased to ensure that the tx does not fail since the price is very low.
        let gasLimit = calcGasMargin(estimatedGas, 100);
        success = await tokenCnt.methods.approve(this.engineContract._address, MAX_UINT256).send({ from: this.accountData.address, gasLimit: gasLimit });
      }

      let txHash: string;

      if(success) {
        txHash = await this.surveyService.sendSurvey(this.survey);
      }

      setAppCover(this.translateService.instant("please_wait"));

      if (txHash) {
        // upload image via infura
        this.survey.imageData = this.survey.logoUrl;

        if(hasImageToUpload) {
          try {
            const result = await this.utilService.ipfsUpload(base64);
  
            if(!result.success) {
              throw new Error(result.data);
            }
  
            const cid = result.data.path;

            // This shouldn't happen
            if(this.survey.logoUrl != "ipfs://" + cid) {
              throw new Error("different cid: " + this.survey.logoUrl + " vs ipfs://" + cid);
            }

            this.survey.imageData = "https://inc.infura-ipfs.io/ipfs/" + cid;// To overcome lazy-thumb timeout in survey-sent
          } catch(err) {
            console.error(err);
            this.messageHelperService.showWarn(this.translateService.instant("failed_upload_survey_logo_use_other_means"));
          }
        }

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
}
