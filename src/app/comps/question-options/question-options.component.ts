import { Component, ElementRef } from '@angular/core';
import { uniqueId } from 'src/app/shared/helper';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-options',
  templateUrl: './question-options.component.html',
  styleUrls: ['./question-options.component.css']
})
export class QuestionOptionsComponent extends BaseQuestionComponent {

  randId: string;

  constructor(
    element: ElementRef
  ) {
    super(element);
    this.randId = uniqueId();
  }

  onInit() {
    this.menuOptions = [
      this.randomOrderMenuOption()
    ];
  }

  onViewLoaded() {
  }

  onDestroy() {
  }
}
