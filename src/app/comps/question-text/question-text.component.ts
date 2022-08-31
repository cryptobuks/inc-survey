import { Component, ElementRef } from '@angular/core';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-text',
  templateUrl: './question-text.component.html',
  styleUrls: ['./question-text.component.css']
})
export class QuestionTextComponent extends BaseQuestionComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
  }

  onViewLoaded() {
  }

  onDestroy() {
  }
}
