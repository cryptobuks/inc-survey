import { Component, ElementRef } from '@angular/core';
import { BaseQuestionComponent } from '../base-question.component';

@Component({
  selector: 'app-question-range',
  templateUrl: './question-range.component.html',
  styleUrls: ['./question-range.component.css']
})
export class QuestionRangeComponent extends BaseQuestionComponent {

  from: number;
  to: number;

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
    if(this.data.state.edited) {
      this.loadFakeValues();
    } else if(!this.data.response.input) {
      this.data.response.input = [this.data.content.min, this.data.content.min];
    }
  }

  onViewLoaded() {
  }

  onDestroy() {
  }

  getOutput(): string {
    if(this.data.response.input[0] == this.data.content.min && this.data.response.input[1] == this.data.content.min) {
      return "";
    }

    let values = [
      this.data.response.input[0],
      this.data.response.input[1]
    ];

    return values.join(";");
  }

  onChangeMin() {
    if(this.data.content.min < -100) {
      this.data.content.min = -100;
    } else if(this.data.content.min > this.data.content.max - 1) {
      this.data.content.min = this.data.content.max - 1;
    }

    this.loadFakeValues();
  }

  onChangeMax() {
    if(this.data.content.max > 100) {
      this.data.content.max = 100;
    } else if(this.data.content.max < this.data.content.min + 1) {
      this.data.content.max = this.data.content.min + 1;
    }

    this.loadFakeValues();
  }

  private loadFakeValues() {
    // to update component
    let diff = Math.floor((this.data.content.max - this.data.content.min) / 5);
    this.from = this.data.content.min + diff;
    this.to = this.data.content.max - diff;
  }
}
