import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import BigNumber from 'bignumber.js';
import { TokenData } from 'src/app/models/token-data';
import { toFixedBigNumber, toFormatBigNumber } from 'src/app/shared/helper';
declare var $: any;

@Component({
  selector: 'input-token',
  templateUrl: './input-token.component.html',
  styleUrls: ['./input-token.component.css']
})
export class InputTokenComponent implements OnInit, OnDestroy {

  @Input()
  title: string;

  @Input()
  data: TokenData;

  @Output()
  onSelect: EventEmitter<any> = new EventEmitter();

  @Output()
  amountChange = new EventEmitter<number>();

  @Output()
  priceClick = new EventEmitter<string>();

  @ViewChild('amountInput')
  amountInput: ElementRef;
  jqInput: any;

  set amount(value: BigNumber) {
    if (!this.data.amount?.isEqualTo(value)) {
      this.data.amount = value;
      this.jqInput.val(toFixedBigNumber(value, this.data.decimals));
    }
  }
  get amount(): BigNumber {
    return this.data.amount;
  }

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    let comp = this;
    this.jqInput = $(this.amountInput.nativeElement);
    this.jqInput.val(toFixedBigNumber(this.amount, this.data.decimals));

    this.jqInput.on('input', function () {
      if (this.checkValidity()) {
        this.value = this.value.replace(/,/g, '.')/*.replace(/[^0-9.]/g, '')*/;
        let num = new BigNumber(this.value);
        comp.setInput(!num.isNaN() ? num : undefined);
      } else {
        this.value = comp.amount;
      }
    });
  }

  ngOnDestroy() {
  }

  emitSelect(e: Event): void {
    this.onSelect.emit(e);
  }

  setInput(value: BigNumber): void {
    if (!this.amount?.isEqualTo(value)) {
      this.amount = value;
      this.amountChange.emit(value?.toNumber());
    }
  }

  onMax(): void {
    this.setMaxAmountValue();
  }

  onBalance(): void {
    this.setMaxAmountValue();
  }

  onPrice(): void {
    this.priceClick.emit(this.data.price);
  }

  hasBalance() {
    return this.data.balance;
  }

  hasPrice() {
    //return parseFloat(this.data.price) > 0;
    return this.data.price;
  }

  humanFriendlyBalance() {
    return toFormatBigNumber(this.data.balance);
  }

  private setMaxAmountValue() {
    if (this.data.balance) {
      this.setInput(new BigNumber(this.data.balance));
    }
  }
}
