import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import BigNumber from 'bignumber.js';
import { TxItem } from 'src/app/models/tx-item';
import { TxValue } from 'src/app/models/tx-value';
import { Web3Service } from 'src/app/services/web3.service';
import { CURRENT_CHAIN, NATIVE_CURRENCY, NET_PARAMS } from 'src/app/shared/constants';
import { toAmount, toFormatBigNumber } from 'src/app/shared/helper';

@Component({
  selector: 'tx-status',
  templateUrl: './tx-status.component.html',
  styleUrls: ['./tx-status.component.css']
})
export class TxStatusComponent implements OnInit, OnDestroy {

  @Input()
  txHash: string;

  @Input()
  isMetaTx: boolean;

  @Input()
  txItems: TxItem[] = [];

  @Input()
  txValues: TxValue[] = [];

  @Output()
  onReceipt: EventEmitter<any> = new EventEmitter();

  get currSymbol(): string { return NATIVE_CURRENCY[CURRENT_CHAIN].symbol; }

  gasUsed: string;
  totalPaid: string;
  explorerName: string;
  explorerLink: string;
  receipt: any;

  constructor(
    private web3Service: Web3Service
  ) {
  }

  ngOnInit() {
    this.explorerName = NET_PARAMS[CURRENT_CHAIN].chainName;
    this.explorerLink = NET_PARAMS[CURRENT_CHAIN].blockExplorerUrls[0] + '/tx/' + this.txHash;
  }

  ngAfterViewInit() {
    this.checkReceipt();
  }

  ngOnDestroy() {
  }

  private async checkReceipt() {
    this.receipt = await this.web3Service.getTransactionReceipt(this.txHash);
    //const tx = await this.web3Service.getTransaction(this.txHash);

    if(this.receipt/* && tx*/) {
      //this.receipt.value = tx.value;
      this.onReceipt.emit(this.receipt);
      this.calcCost();
      this.loadBalance();
      return;
    }

    setTimeout(() => {
      this.checkReceipt();
    }, 3000);// Check again in 3 seconds
  }

  private calcCost() {
    let txGasUsed = new BigNumber(this.receipt.gasUsed);
    let txGasPrice = new BigNumber(this.receipt.effectiveGasPrice);
    let gasUnits = txGasUsed.multipliedBy(txGasPrice);
    let totalUnits = gasUnits;

    for(let txVal of this.txValues) {
      let valUnits = this.receipt.status? new BigNumber(txVal.value): new BigNumber(0);
      totalUnits = totalUnits.plus(valUnits);
      txVal.amountUsed = toFormatBigNumber(toAmount(valUnits));
    }

    this.gasUsed = toFormatBigNumber(toAmount(gasUnits));
    this.totalPaid = toFormatBigNumber(toAmount(totalUnits));
  }

  private async loadBalance() {
    await this.web3Service.loadAccountData(false);
  }
}
