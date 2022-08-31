import { Component, ElementRef } from '@angular/core';
import { BaseQuestionDateComponent } from '../base-question-date-.component';

@Component({
  selector: 'app-question-date-range',
  templateUrl: './question-date-range.component.html',
  styleUrls: ['./question-date-range.component.css']
})
export class QuestionDateRangeComponent extends BaseQuestionDateComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
    super.onInit();
    if(!this.data.response.input) {
      this.data.response.input = [
        undefined, undefined
      ];
    }
  }

  onViewLoaded() {
    super.onViewLoaded();
  }

  onDestroy() {
    super.onDestroy();
  }

  getOutput(): string {
    if(!this.data.response.input[0] || !this.data.response.input[1]) {
      return "";
    }

    let values = [
      Math.round(this.data.response.input[0].getTime() / 1000),
      Math.round(this.data.response.input[1].getTime() / 1000)
    ];

    return values.join(";");
  }
}
