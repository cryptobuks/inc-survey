import { Component, ElementRef } from '@angular/core';
import { uniqueId } from 'src/app/shared/helper';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-checks',
  templateUrl: './question-checks.component.html',
  styleUrls: ['./question-checks.component.css']
})
export class QuestionChecksComponent extends BaseQuestionComponent {

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

    if(!this.data.state.edited && !this.data.response.input) {
      this.data.response.input = [];
    }
  }

  onViewLoaded() {
  }

  onDestroy() {
  }

  getOutput(): string {
    let values = this.data.response.input?? [];
    return (values.length > 0)? values.join(";"): "";
  }
}
