import { Component, ElementRef } from '@angular/core';
import { BaseResponseComponent } from '../base-response-component';

@Component({
  selector: 'app-response-text',
  templateUrl: './response-text.component.html',
  styleUrls: ['./response-text.component.css']
})
export class ResponseTextComponent extends BaseResponseComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }
}
