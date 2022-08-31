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
  iconTooltip: string;

  @Input()
  iconTooltipPosition = 'left';

  @Input()
  background: string = "#5269c3";

  @Input()
  color: string = "#ffffff";

  @Output()
  onIconClick: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  emitIconClick(e: Event): void {
    this.onIconClick.emit(e);
  }
}
