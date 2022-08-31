import { Component, ElementRef } from '@angular/core';
import { BaseResponseComponent } from '../base-response-component';
declare var ApexCharts: any;
declare var $: any;

@Component({
  selector: 'app-response-options',
  templateUrl: './response-options.component.html',
  styleUrls: ['./response-options.component.css']
})
export class ResponseOptionsComponent extends BaseResponseComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  async onLoadResponses() {
    let values = {};
    let count = 0;

    while (this.data.iterator.hasNext()) {
      let responses = await this.data.iterator.next();
      for (let response of responses) {
        if(!this.checkResponse(response)) {
          continue;
        }

        if (values[response]) {
          values[response]++;
        } else {
          values[response] = 1;
        }

        count++;
      }
    }

    let comp = this;

    let chartData = {
      theme: this.chartTheme,
      chart: {
        background: 'transparent',
        type: 'donut'
      },
      tooltip: {
        y: {
          formatter: function (val, { series, seriesIndex, dataPointIndex, w }) {
            return comp.questionData.options[dataPointIndex].label + ': ' + val;
          },
          title: {
            formatter: function (seriesName) {
              return '';
            }
          }
        }
      },
      labels: [],
      series: []
    };

    for (let option of this.questionData.options) {
      chartData.labels.push(this.normalizeLabel(option.label));
      chartData.series.push(values[option.value] ?? 0);
    }

    let chartCnt = $("> .chart", $(this.element.nativeElement))[0];
    let chart = new ApexCharts(chartCnt, chartData);

    return { chart, count };
  }
}
