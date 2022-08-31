import { Component, ElementRef } from '@angular/core';
import { getInput } from 'src/app/models/survey-support';
import { randomIntFromInterval } from 'src/app/shared/helper';
import { BaseResponseComponent } from '../base-response-component';
declare var ApexCharts: any;
declare var $: any;

@Component({
  selector: 'app-response-date',
  templateUrl: './response-date.component.html',
  styleUrls: ['./response-date.component.css']
})
export class ResponseDateComponent extends BaseResponseComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  async onLoadResponses() {
    let count = 0;

    let chartData = {
      theme: this.chartTheme,
      chart: {
        background: 'transparent',
        type: 'scatter',
        zoom: {
          type: 'xy'
        },
        toolbar: {
          tools: {
            download: false
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        y: {
          formatter: function (val, { series, seriesIndex, dataPointIndex, w }) {
            let date = new Date(w.config.series[seriesIndex].data[dataPointIndex][0]);
            return date.toLocaleDateString();
          },
          title: {
            formatter: function (seriesName) {
              return '';
            }
          }
        }
      },
      grid: {
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
      },
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        max: 100
      },
      series: [{
        name: '',
        data: []
      }]
    };

    for (let response of this.data.responses) {
      if (!this.checkResponse(response)) {
        continue;
      }

      let date = getInput(this.data.question.content.componentType, response) as Date;
      let y = randomIntFromInterval(10, 90);

      chartData.series[0].data.push([date.getTime(), y]);
      count++;
    }

    let chartCnt = $("> .chart", $(this.element.nativeElement))[0];
    let chart = new ApexCharts(chartCnt, chartData);

    return { chart, count };
  }
}
