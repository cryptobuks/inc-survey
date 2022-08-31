import { Component, ElementRef } from '@angular/core';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-dropdown',
  templateUrl: './question-dropdown.component.html',
  styleUrls: ['./question-dropdown.component.css']
})
export class QuestionDropdownComponent extends BaseQuestionComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
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

  // overriding super class method
  canRemOption() {
    return this.data.content.options.length > 1;
  }
}
