import { Component, ElementRef } from '@angular/core';
import { BaseQuestionDateComponent } from '../base-question-date-.component';

@Component({
  selector: 'app-question-date',
  templateUrl: './question-date.component.html',
  styleUrls: ['./question-date.component.css']
})
export class QuestionDateComponent extends BaseQuestionDateComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
    super.onInit();
  }

  onViewLoaded() {
    super.onViewLoaded();
  }

  onDestroy() {
    super.onDestroy();
  }

  getOutput(): string {
    if(!this.data.response.input) {
      return "";
    }

    let value = Math.round(this.data.response.input.getTime() / 1000);
    return value.toString();
  }
}
