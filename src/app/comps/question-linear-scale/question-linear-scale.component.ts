import { Component, ElementRef } from '@angular/core';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-linear-scale',
  templateUrl: './question-linear-scale.component.html',
  styleUrls: ['./question-linear-scale.component.css']
})
export class QuestionLinearScaleComponent extends BaseQuestionComponent {

  stateOptions: any[] = [];

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
    if(this.data.state.edited) {
      for(let i = 0; i <= 10; i++) {
        this.stateOptions.push({ label: i, value: i });
      }
    } else {
      for(let i = this.data.content.from; i <= this.data.content.to; i++) {
        this.stateOptions.push({ label: i, value: i });
      }
    }
  }

  onViewLoaded() {
  }

  onDestroy() {
  }
}
