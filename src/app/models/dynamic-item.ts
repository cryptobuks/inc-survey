import { Type } from '@angular/core';
import { DynamicComponent } from '../comps/dynamic-template/dynamic-template.component';

export class DynamicItem {
  
  instance: DynamicComponent;

  constructor(public component: Type<any>, public data: any) {}
}