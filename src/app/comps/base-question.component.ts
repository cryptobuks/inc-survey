import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppModule } from '../app.module';
import { MenuOption } from '../models/menu-option';
import { QuestionData } from '../models/survey-support';
import { cloneDeep, randomIntFromInterval, shuffle } from '../shared/helper';
import { DynamicComponent } from './dynamic-template/dynamic-template.component';

@Component({
    template: 'NO UI TO BE FOUND HERE!'
})
export abstract class BaseQuestionComponent implements OnInit, OnDestroy, DynamicComponent {

  protected translateService: TranslateService;

  data: QuestionData;
  menuOptions: MenuOption[];
  sortedOptions: any[];

  constructor(public element: ElementRef) { 
    this.translateService = AppModule.injector.get(TranslateService);
  }

  ngOnInit() {
    if(!this.data.state.edited && this.data.content.options) {
      this.sortedOptions = cloneDeep(this.data.content.options);

      if(this.data.content.randomOrder) {
        shuffle(this.sortedOptions);
      }
    }

    this.data.response.output = () => {
      return this.getOutput();
    };

    this.onInit();
  }

  ngAfterViewInit() {
    this.onViewLoaded();
  }

  ngOnDestroy() {
    this.onDestroy();
  }

  getOutput(): string {
    return this.data.response.input?.toString()?? "";
  }

  abstract onInit(): void;
  abstract onViewLoaded(): void;
  abstract onDestroy(): void;

  randomOrderMenuOption() {
    return {
      titleKey: 'sort_randomly',
      checked: this.data.content.randomOrder,
      onClick: (index: number) => {
        this.data.content.randomOrder = !this.data.content.randomOrder;
        this.menuOptions[index].checked = this.data.content.randomOrder;
      }
    } as MenuOption;
  }

  canAddOption() {
    return this.data.content.options.length <= 100;
  }

  canRemOption() {
    return this.data.content.options.length > 2;
  }

  addOption() {
    let value: number;

    do {
      value = randomIntFromInterval(1, 999);// max is 100
    } while(this.data.content.options.some( (opt: { value: number; }) => opt.value === value ));

    let num = this.data.content.options.length + 1;

    this.data.content.options.push({
      value: value,
      label: this.translateService.instant("option") + " " +  num
    });
  }

  remOption(index: number) {
    this.data.content.options.splice(index, 1);
  }
}