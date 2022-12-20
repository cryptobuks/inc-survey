import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'balance-chip',
  templateUrl: './balance-chip.component.html',
  styleUrls: ['./balance-chip.component.css']
})
export class BalanceChipComponent implements OnInit {

  @Input()
  symbol: string;

  @Input()
  symbolIcon: string;

  @Input()
  balance: string;

  @Input()
  icon: string;

  @Input()
  symbolTooltip: string;

  @Input()
  iconTooltip: string;

  @Input()
  iconTooltipPosition = 'left';

  @Input()
  background: string = "#5269c3";

  @Input()
  color: string = "#ffffff";

  @Output()
  onSymbolClick: EventEmitter<any> = new EventEmitter();

  @Output()
  onIconClick: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  emitSymbolClick(e: Event) {
    this.onSymbolClick.emit(e);
  }

  emitIconClick(e: Event): void {
    this.onIconClick.emit(e);
  }
}
