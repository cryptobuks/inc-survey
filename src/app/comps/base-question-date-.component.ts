import { Component, ElementRef } from '@angular/core';
import { BaseQuestionComponent } from './base-question.component';

@Component({
    template: 'NO UI TO BE FOUND HERE!'
})
export abstract class BaseQuestionDateComponent extends BaseQuestionComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
    if(this.data.content.showSeconds === undefined) {
      this.data.content.showSeconds = true;
    }

    this.menuOptions = [
      {
        titleKey: 'show_time',
        checked: this.data.content.showTime,
        onClick: (index: number) => {
          this.data.content.showTime = !this.data.content.showTime;
          this.menuOptions[index].checked = this.data.content.showTime;
          this.menuOptions[1].disabled = !this.data.content.showTime;
        }
      },
      {
        titleKey: 'show_seconds',
        checked: this.data.content.showSeconds,
        disabled: !this.data.content.showTime,
        onClick: (index: number) => {
          this.data.content.showSeconds = !this.data.content.showSeconds;
          this.menuOptions[index].checked = this.data.content.showSeconds;
        }
      }
    ];
  }

  onViewLoaded() {
  }

  onDestroy() {
  }
}
