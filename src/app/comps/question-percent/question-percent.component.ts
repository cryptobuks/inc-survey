import { Component, ElementRef } from '@angular/core';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-percent',
  templateUrl: './question-percent.component.html',
  styleUrls: ['./question-percent.component.css']
})
export class QuestionPercentComponent extends BaseQuestionComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
    if (!this.data.response.input) {
      this.data.response.input = 0;
    }
  }

  onViewLoaded() {
  }

  onDestroy() {
  }

  getOutput(): string {
    return (this.data.response.input > 0)? this.data.response.input.toString(): "";
  }
}
