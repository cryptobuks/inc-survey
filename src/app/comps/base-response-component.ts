import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from '../app.component';
import { AppModule } from '../app.module';
import { ResponseData } from '../models/survey-support';
import { destroyChart, renderChart } from '../shared/helper';
import { DynamicComponent } from './dynamic-template/dynamic-template.component';

@Component({
    template: 'NO UI TO BE FOUND HERE!'
})
export abstract class BaseResponseComponent implements OnInit, OnDestroy, DynamicComponent {

  protected translateService: TranslateService;
  data: ResponseData;
  questionData: any;
  private chart: any;

  get chartTheme() {
    return AppComponent.instance.chartTheme;
  };

  constructor(public element: ElementRef) { 
    this.translateService = AppModule.injector.get(TranslateService);
  }

  ngOnInit() {
    this.questionData = this.data.question.content.componentData;
    this.loadResponses();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if(this.chart) destroyChart(this.chart);
  }

  normalizeLabel(label: string, maxLength = 30): string {
    if(label.length > maxLength && maxLength > 4) {
      label = label.substring(0, maxLength - 4) + ' ...';
    }

    return label;
  }

  checkResponse(response: string) {
    if(response.trim().length == 0) {
      if(this.data.question.mandatory) {
        throw new Error("Inconsistency, unanswered mandatory question: " + this.data.question.content);
      }

      return false;
    }

    return true;
  }

  async onLoadResponses(): Promise<{ chart: any, count: number }> {
    return { chart: undefined, count: 0 };
  }

  private async loadResponses() {
    if(this.chart) destroyChart(this.chart);

    const result = await this.onLoadResponses();
    this.chart = result.chart;
    
    if(this.chart) renderChart(this.chart);

    if(this.data.onLoaded) {
      this.data.onLoaded(result.count);
    }
  }
}