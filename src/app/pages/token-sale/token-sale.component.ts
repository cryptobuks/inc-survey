import { Component, ElementRef, ViewChild } from '@angular/core';
import { BasePageComponent } from '../base-page.component';
import { calcGasMargin, callbackWhen, cloneDeep, removeAppCover, setAppCover, toAmount, toFixedBigNumber, toFormatBigNumber, toUnits } from 'src/app/shared/helper';
import { InputTokenComponent } from 'src/app/comps/input-token/input-token.component';
import { TokenData } from 'src/app/models/token-data';
import { CURRENT_CHAIN, NATIVE_CURRENCY, INC_TOKEN, NET_PARAMS } from 'src/app/shared/constants';
import BigNumber from 'bignumber.js';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { ChainId } from 'src/app/models/chains';
declare var $: any;

const MIN_MATIC = new BigNumber(0.01);
const SUGGESTED_MATIC = new BigNumber(1);

const MIN_AMOUNT: { [chainId: number]: BigNumber } = {
  [ChainId.MATIC]: MIN_MATIC,
  [ChainId.MUMBAI]: MIN_MATIC,
  [ChainId.LOCAL]: MIN_MATIC
};

const SUGGESTED_AMOUNT: { [chainId: number]: BigNumber } = {
  [ChainId.MATIC]: SUGGESTED_MATIC,
  [ChainId.MUMBAI]: SUGGESTED_MATIC,
  [ChainId.LOCAL]: SUGGESTED_MATIC
};

enum SaleState {
  NONE,
  PENDING,
  STARTED,
  FINISHED
}

export interface TxData {
  autoTolerance: boolean;
  tolerance: number | undefined;// decimal percent [0-100]
  timeLimit: number;// in minutes [1-180]
}

@Component({
  selector: 'app-token-sale',
  templateUrl: './token-sale.component.html',
  styleUrls: ['./token-sale.component.css']
})
export class TokenSaleComponent extends BasePageComponent {

  readonly titleKey = "inc_sale";

  txConfig: TxData = {
    tolerance: undefined,
    autoTolerance: true,
    timeLimit: 30
  };

  tokenFrom: TokenData = cloneDeep(NATIVE_CURRENCY[CURRENT_CHAIN]);
  tokenTo: TokenData = cloneDeep(INC_TOKEN[CURRENT_CHAIN]);

  tokenRate: number;
  usdPrice: BigNumber;
  valueInfo: string;
  valuePrice: string;

  rateAmount: string;
  offerAmount: string;
  raisedAmount: string;
  raisedPercent: number;

  refreshInterval: any;
  refreshTimeout: number;

  switchedValueInfo = false;
  displayTxConfig = false;
  buying = false;

  saleState = SaleState.NONE;
  get SaleState() {
    return SaleState;
  }

  get minAmount(): BigNumber {
    return MIN_AMOUNT[CURRENT_CHAIN];
  }
  get suggestedAmount(): BigNumber {
    return SUGGESTED_AMOUNT[CURRENT_CHAIN];
  }
  get buyEnabled(): boolean {
    return this.hasConnection && this.loadedChainData && 
    this.minAmount.isLessThanOrEqualTo(this.tokenFrom.amount) && 
    this.tokenFrom.balance?.isGreaterThanOrEqualTo(this.tokenFrom.amount);
  };
  get buyLabel(): string {
    if (!this.hasConnection) {
      return this.translateService.instant("connect_wallet");
    }

    if (!this.loadedChainData) {
      return this.translateService.instant("select_x", { val1: NET_PARAMS[CURRENT_CHAIN].chainName });
    }

    if (!this.tokenFrom.amount) {
      return this.translateService.instant("amount_not_indicated");
    }

    if (this.minAmount.isGreaterThan(this.tokenFrom.amount)) {
      return this.translateService.instant("amount_too_small");
    }

    if (this.tokenFrom.balance?.isLessThan(this.tokenFrom.amount)) {
      return this.translateService.instant("insufficient_currency_balance", { val1: this.currSymbol });
    }

    if (this.buying) {
      return this.translateService.instant("in_process");
    }

    return this.translateService.instant("swap");
  };

  @ViewChild('swapInput') swapInput: InputTokenComponent;
  @ViewChild('swapOutput') swapOutput: InputTokenComponent;

  private onChainLoadedRemover: ListenerRemover;
  private onAccountLoadedRemover: ListenerRemover;

  constructor(element: ElementRef) {
    super(element);
    this.tokenFrom.amount = this.suggestedAmount;
  }

  onInit(): void {
    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.refresh();
    }, () => {
      return this.loadedChainData;
    });

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.refresh();
    });
  }

  onViewLoaded(): void {
  }

  onDestroy(): void {
    clearInterval(this.refreshInterval);
    this.onChainLoadedRemover();
    this.onAccountLoadedRemover();
  }

  openTxConfig(): void {
    this.displayTxConfig = true;
  }

  onToleranceChanged(e: any): void {
    this.txConfig.autoTolerance = !(e.value > 0);
  }

  onAutoToleranceChanged(e: any): void {
    if (e.checked) {
      this.txConfig.tolerance = undefined;
    }
  }

  openTokenSelector(tokenData: TokenData): void {
  }

  onAmountChanged(tokenData: TokenData) {
    this.setEquivalentAmount(tokenData);
    this.loadCcyPrice();
  }

  onPriceClick(tokenData: TokenData) {
    this.loadCcyPrice();
  }

  onOfferStarted() {
    this.refresh();
  }

  onOfferFinished() {
    this.finalizeSale();
  }

  /*switchTokens(): void {
    let inputData = this.tokenFrom;
    this.tokenFrom = this.tokenTo;
    this.tokenTo = inputData;
  }*/

  switchValueInfo() {
    this.switchedValueInfo = !this.switchedValueInfo;
    this.setValueInfo();
  }

  async refresh() {
    if (!this.hasConnection || !this.loadedChainData) {
      return;
    }

    //this.swapOutput.amount = undefined;
    //this.tokenTo.price = undefined;
    await this.loadPairWith(this.tokenFrom);
    this.setRefreshInterval();
  }

  checkout(event: Event) {
    let amount = toFixedBigNumber(this.tokenFrom.amount, this.tokenFrom.decimals);
    let weiAmount = toUnits(amount, this.tokenFrom.decimals);
    let timeLimitInSeconds = this.txConfig.timeLimit * 60;
    let deadline = Math.round(this.web3Service.currenTime / 1000) + timeLimitInSeconds;
    let minTknUnits: BigNumber;

    let futureRate = this.calcTokenRate(deadline);
    let minAchievable = new BigNumber(weiAmount).multipliedBy(new BigNumber(futureRate));

    if(this.txConfig.autoTolerance) {
      minTknUnits = minAchievable;
    } else {
      this.setTokenRate();
      let tknUnits = new BigNumber(weiAmount).multipliedBy(new BigNumber(this.tokenRate));
      let maxLoss = tknUnits.multipliedBy(this.txConfig.tolerance).dividedBy(100);
      minTknUnits = tknUnits.minus(maxLoss);
    }

    let minTknAmount = toFormatBigNumber(toAmount(minTknUnits));
    let message = this.translateService.instant('output_is_estimated_will_receive_x_or_revert', { val1: minTknAmount + ' INC' });
    let icon = 'pi pi-exclamation-circle';

    if(minAchievable.isLessThan(minTknUnits)) {
      message += '\n' + this.translateService.instant('slippage_tolerance_may_be_exceeded');
      icon = 'pi pi-exclamation-triangle';
    }

    this.confirmationService.confirm({
        target: event.target,
        message: message,
        icon: icon,
        accept: () => {
          this.buyToken(weiAmount, deadline, minTknUnits);
        },
        reject: () => {
        }
    });

    // Use html when showing confirmation dialog
    message = this.translateService.instant('output_is_estimated_will_receive_x_or_revert', { val1: '<b>' + minTknAmount + ' INC</b>' });

    if(minAchievable.isLessThan(minTknUnits)) {
      message += '<div style="color:red;">' + this.translateService.instant('slippage_tolerance_may_be_exceeded') + '</div>';
    }

    callbackWhen(() => {
      $('.p-confirm-popup .p-confirm-popup-message').html(message);
    }, () => {
      return $('.p-confirm-popup .p-confirm-popup-message')[0];
    });
  }

  async buyToken(weiAmount: BigNumber, deadline: number, minTknUnits: BigNumber) {
    this.buying = true;

    try {
      setAppCover(this.translateService.instant("waiting_reply"));
      
      let data = this.offerContract.methods.buy(deadline, minTknUnits).encodeABI();
      let estimatedGas = await this.web3Service.estimateGas(this.accountData.address, this.offerContract._address, data, { value: weiAmount });
      let gasLimit = calcGasMargin(estimatedGas);

      let tx = await this.offerContract.methods.buy(deadline, minTknUnits).send({ from: this.accountData.address, value: weiAmount, gasLimit: gasLimit });
      //console.log("tx:: " + JSON.stringify(tx));

      await this.web3Service.loadAccountData();

      let incAmount = toAmount(tx.events.OnBought.returnValues.tokenAmount);
      this.messageHelperService.showSuccess(this.translateService.instant("have_bought_x", { val1: incAmount + ' INC' }));

      if(tx.events.OnReward) {
        incAmount = toAmount(tx.events.OnReward.returnValues.amount);
        this.messageHelperService.showInfo(this.translateService.instant("have_received_reward_x", { val1: incAmount + ' INC' }));
      }

    } catch (err: any) {
      this.messageHelperService.showTxError(err);
    } finally {
      removeAppCover();
      this.buying = false;
    }
  }

  private async loadPairWith(tokenData: TokenData) {
    this.setTokenRate();
    this.setEquivalentAmount(tokenData);
    this.setBalance(this.tokenFrom);
    this.setBalance(this.tokenTo);
    await this.loadCcyPrice();
    await this.setSaleProgress();
  }

  private setRefreshInterval() {
    if(this.saleState != SaleState.STARTED) {
      return;
    }

    this.refreshTimeout = 10;
    clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      this.refreshTimeout--;

      if(this.refreshTimeout == 0) {
        clearInterval(this.refreshInterval);
        this.refresh();
      }
    }, 1000);
  }

  private finalizeSale() {
    clearInterval(this.refreshInterval);
    this.rateAmount = "0";
    this.refreshTimeout = undefined;
    this.saleState = SaleState.FINISHED;
  }

  private setTokenRate() {
    let timestamp = Math.round(this.web3Service.currenTime / 1000);
    this.tokenRate = this.calcTokenRate(timestamp);
    this.rateAmount = toFormatBigNumber(new BigNumber(this.tokenRate));
  }

  private setEquivalentAmount(tokenData: TokenData) {
    if (tokenData == this.tokenFrom) {// Currency changed
      let incAmount = this.ccyToInc(this.tokenFrom.amount);

      if (this.swapOutput) {// if called from constructor the component will not be available yet
        this.swapOutput.amount = incAmount;
      } else {
        this.tokenTo.amount = incAmount;
      }
    } else {// INC changed
      let ccyAmount = this.incToCcy(this.tokenTo.amount);

      if (this.swapInput) {
        this.swapInput.amount = ccyAmount;
      } else {
        this.tokenFrom.amount = ccyAmount;
      }
    }
  }

  private /*async*/ setBalance(tokenData: TokenData) {
    if (tokenData.address) {// Token balance
      //tokenData.balance = await this.web3Service.getERC20Balance(tokenData.address, this.accountData.address);
      tokenData.balance = toAmount(this.accountData.incBalance);
    } else {// Currency balance
      //tokenData.balance = await this.web3Service.getCcyBalance(this.accountData.address);
      tokenData.balance = toAmount(this.accountData.ccyBalance);
    }
  }

  private async loadCcyPrice() {
    const ccyPrice = await this.utilService.getCurrencyPrice(this.currSymbol);
    this.usdPrice = new BigNumber(ccyPrice);
    this.setPrice(this.tokenFrom);
    this.setPrice(this.tokenTo);
    this.setValueInfo();
  }

  private async setSaleProgress()  {
    const timestamp = Math.round(this.web3Service.currenTime / 1000);
    this.saleState = (timestamp >= this.offerProps.openingTime)? SaleState.STARTED: SaleState.PENDING;

    if(this.saleState == SaleState.PENDING) {
      return;
    }
    
    const owner = await this.incContract.methods.owner().call();
    const rmngUnits = await this.web3Service.getIncAllowance(owner, this.offerContract._address);
    const totalSupply = await this.web3Service.getIncTotalSupply();
    const offerUnits = totalSupply.multipliedBy(.15);
    const raisedUnits = offerUnits.minus(rmngUnits);

    this.offerAmount = toFormatBigNumber(toAmount(offerUnits));
    this.raisedAmount = toFormatBigNumber(toAmount(raisedUnits));
    this.raisedPercent = raisedUnits.dividedBy(offerUnits).multipliedBy(100).toNumber();

    if(!rmngUnits.isGreaterThan(0)) {
      this.finalizeSale();
    }
  }

  private calcTokenRate(timestamp: number) {
    let openingTime = this.offerProps.openingTime;
    let closingTime = this.offerProps.closingTime;
    let initialRate = this.offerProps.initialRate;
    let finalRate = this.offerProps.finalRate;

    let elapsedTime = timestamp - openingTime;
    let timeRange = closingTime - openingTime;
    let rateRange = initialRate - finalRate;

    return Math.floor(initialRate - elapsedTime * rateRange / timeRange);
  }

  private ccyToInc(ccyAmount: number | string | BigNumber) {
    let ccyUnits = toUnits(ccyAmount ?? 0, this.tokenFrom.decimals);
    let incUnits = new BigNumber(ccyUnits).multipliedBy(new BigNumber(this.tokenRate));
    return toAmount(incUnits, this.tokenTo.decimals);
  }

  private incToCcy(incAmount: number | string | BigNumber) {
    let incUnits = toUnits(incAmount ?? 0, this.tokenTo.decimals);
    let ccyUnits = new BigNumber(incUnits).dividedBy(new BigNumber(this.tokenRate));
    return toAmount(ccyUnits, this.tokenFrom.decimals);
  }

  private setPrice(tokenData: TokenData) {
    tokenData.price = undefined;

    if (!tokenData.amount) {
      return;
    }

    let price: BigNumber;

    if (tokenData.address) {// Token balance
      let ccyAmount = this.incToCcy(tokenData.amount);
      price = ccyAmount.multipliedBy(this.usdPrice);
    } else {// Currency balance
      price = tokenData.amount.multipliedBy(this.usdPrice);
    }

    tokenData.price = toFormatBigNumber(price);
  }

  private setValueInfo() {
    if (!this.switchedValueInfo) {
      this.setValueCcyPerInc();
    } else {
      this.setValueIncPerCcy();
    }
  }

  private setValueCcyPerInc() {
    let ccyAmount = this.incToCcy(1);
    let ccyPerToken = toFormatBigNumber(ccyAmount, 18);
    this.valueInfo = ccyPerToken ? `1 INC = ${ccyPerToken} ${this.currSymbol}` : undefined;

    let price = ccyAmount.multipliedBy(this.usdPrice);
    this.valuePrice = toFormatBigNumber(price, 10);
  }

  private setValueIncPerCcy() {
    let incAmount = this.ccyToInc(1);
    let incPerCcy = toFormatBigNumber(incAmount, 18);
    this.valueInfo = incPerCcy ? `1 ${this.currSymbol} = ${incPerCcy} INC` : undefined;
    this.valuePrice = toFormatBigNumber(this.usdPrice, 10);
  }
}
