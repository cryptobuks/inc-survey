import { Component, ElementRef } from '@angular/core';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-rating',
  templateUrl: './question-rating.component.html',
  styleUrls: ['./question-rating.component.css']
})
export class QuestionRatingComponent extends BaseQuestionComponent {

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
