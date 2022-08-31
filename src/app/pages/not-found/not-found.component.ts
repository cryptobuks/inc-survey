import { Component, ElementRef } from '@angular/core';
import { BasePageComponent } from '../base-page.component';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent extends BasePageComponent {

  readonly titleKey = "app_name";

  constructor(element: ElementRef) {
    super(element);
  }

  onInit(): void {
  }

  onDestroy(): void {
  }

  onViewLoaded(): void {
  }
}
