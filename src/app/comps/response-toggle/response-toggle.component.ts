import { Component, ElementRef } from '@angular/core';
import { BaseResponseComponent } from '../base-response-component';
declare var ApexCharts: any;
declare var $: any;

@Component({
  selector: 'app-response-toggle',
  templateUrl: './response-toggle.component.html',
  styleUrls: ['./response-toggle.component.css']
})
export class ResponseToggleComponent extends BaseResponseComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  async onLoadResponses() {
    let { values, count } = this.loadValues();
    let labels = [this.translateService.instant('yes'), this.translateService.instant('no')];

    let chartData = {
      theme: this.chartTheme,
      chart: {
        background: 'transparent',
        type: 'pie'
      },
      tooltip: {
        y: {
          formatter: function (val, { series, seriesIndex, dataPointIndex, w }) {
            return labels[dataPointIndex] + ': ' + val;
          },
          title: {
            formatter: function (seriesName) {
              return '';
            }
          }
        }
      },
      labels: labels,
      series: []
    };

    chartData.series.push(values["true"] ?? 0);
    chartData.series.push(values["false"] ?? 0);

    let chartCnt = $("> .chart", $(this.element.nativeElement))[0];
    let chart = new ApexCharts(chartCnt, chartData);

    return { chart, count };
  }
}
