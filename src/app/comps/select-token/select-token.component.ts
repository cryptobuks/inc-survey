import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TokenData } from 'src/app/models/token-data';
import { Web3Service } from 'src/app/services/web3.service';
import { shortAddress, toAmount, toFormatBigNumber } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';

@Component({
  selector: 'select-token',
  templateUrl: './select-token.component.html',
  styleUrls: ['./select-token.component.css']
})
export class SelectTokenComponent implements OnInit, OnDestroy {

  @Input()
  data: TokenData;

  @Output()
  onSelect: EventEmitter<any> = new EventEmitter();

  get shortAddress(): string {
    return shortAddress(this.data.address);
  };

  get hasSelect(): boolean {
    return this.onSelect.observed;
  };

  private onAccountLoadedRemover: ListenerRemover;

  constructor(private web3Service: Web3Service) { }

  ngOnInit(): void {
    if(!this.data.balance || !this.data.hfBalance) {
      this.loadBalance();
    }

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.loadBalance();
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.onAccountLoadedRemover && this.onAccountLoadedRemover();
  }

  emitSelect(e: Event): void {
    this.onSelect.emit(e);
  }

  async loadBalance() {
    try {
      await this.web3Service.loadTokenBalance(this.data);
    } catch (error) {
      console.error("Failed to get balance for " + this.data.symbol);
    }
  }
}
