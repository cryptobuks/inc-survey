import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
declare var $: any;

@Component({
  selector: 'toggle-switch',
  templateUrl: './toggle-switch.component.html',
  styleUrls: ['./toggle-switch.component.css']
})
export class ToggleSwitchComponent implements OnInit, OnDestroy {

  @Input()
  set checked(value: boolean) {
    if(this._checked !== undefined && this._checked !== value) {
      this.checkedChange.emit(value);
    }

    this._checked = value;
  }
  get checked() {
    return this._checked;
  }
  private _checked: boolean;

  @Input()
  color = '#cd5c5c';

  @Output()
  checkedChange = new EventEmitter<boolean>();

  jqCheckbox: any;
  jqSlider: any;

  constructor(private element: ElementRef) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.jqCheckbox = $(this.element.nativeElement).find("input");
    this.jqSlider = $(this.element.nativeElement).find(".slider");
    this.setColor();
    let comp = this;

    this.jqCheckbox.on('change', function () {
      comp.setColor();
    });
  }

  ngOnDestroy() {
  }

  setColor() {
    if (this.checked) {
      this.jqSlider.css('--toggle-switch-circle-color', this.color);
    } else {
      this.jqSlider.css('--toggle-switch-circle-color', 'white');
    }
  }
}
