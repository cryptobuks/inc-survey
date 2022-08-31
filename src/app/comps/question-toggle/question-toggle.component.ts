import { Component, ElementRef } from '@angular/core';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-toggle',
  templateUrl: './question-toggle.component.html',
  styleUrls: ['./question-toggle.component.css']
})
export class QuestionToggleComponent extends BaseQuestionComponent {

  stateOptions: any[] = [];

  constructor(
    element: ElementRef
  ) {
    super(element);

    this.stateOptions = [
      { label: this.translateService.instant('yes'), value: true }, 
      { label: this.translateService.instant('no'), value: false }
    ];
  }

  onInit() {
  }

  onViewLoaded() {
  }

  onDestroy() {
  }
}
