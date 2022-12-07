import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TokenData } from 'src/app/models/token-data';
import { Web3Service } from 'src/app/services/web3.service';
import { shortAddress } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { Clipboard } from '@angular/cdk/clipboard';
import { OverlayPanel } from 'primeng/overlaypanel';

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

  @ViewChild('menuOverlay') menuOverlay: OverlayPanel;

  get shortAddress(): string {
    return shortAddress(this.data.address);
  };

  get hasSelect(): boolean {
    return this.onSelect.observed;
  };

  private onAccountLoadedRemover: ListenerRemover;

  constructor(
    private web3Service: Web3Service,
    private clipboard: Clipboard
  ) { }

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

  emitSelect(e: Event) {
    this.onSelect.emit(e);
  }

  onRightClick(e: Event) {
    if(!this.data.address) {
      return;
    }

    e.preventDefault();
    this.menuOverlay.toggle(e);
   }

  copyAddress() {
    this.menuOverlay.hide();
    this.clipboard.copy(this.data.address);
  }

  async loadBalance() {
    try {
      await this.web3Service.loadTokenBalance(this.data);
    } catch (error) {
      console.error("Failed to get balance for " + this.data.symbol);
    }
  }
}
