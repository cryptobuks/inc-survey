import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'dash-card',
  templateUrl: './dash-card.component.html',
  styleUrls: ['./dash-card.component.css']
})
export class DashCardComponent implements OnInit {

  @Input()
  icon: string;

  @Input()
  iconBg: string;

  @Input()
  iconColor: string;

  @Input()
  title: string;

  @Input()
  value: string;

  @Input()
  infoIcon: string;

  @Input()
  info: string;

  @Input()
  extraIcon: string;

  @Input()
  extraTooltip: string;

  @Input()
  disabledAction: boolean;

  @Output()
  onInfoClick: EventEmitter<any> = new EventEmitter();

  @Output()
  onExtraClick: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  emitInfoClick(e: Event): void {
    this.onInfoClick.emit(e);
  }

  emitExtraClick(e: Event): void {
    this.onExtraClick.emit(e);
  }
}
