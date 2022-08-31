import { Component, ElementRef } from '@angular/core';
import { getInput } from 'src/app/models/survey-support';
import { BaseResponseComponent } from '../base-response-component';
declare var ApexCharts: any;
declare var $: any;

@Component({
  selector: 'app-response-range',
  templateUrl: './response-range.component.html',
  styleUrls: ['./response-range.component.css']
})
export class ResponseRangeComponent extends BaseResponseComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  async onLoadResponses() {
    let count = 0;

    let rangeTxt = this.translateService.instant("range");

    let chartData = {
      theme: this.chartTheme,
      chart: {
        background: 'transparent',
        type: 'rangeBar',
        toolbar: {
          tools: {
            download: false
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          dataLabels: {
            hideOverflowingLabels: false
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val, opts) {
          /*let diff = val[1] - val[0];
          return rangeTxt + ': ' + diff;*/
          return val[0] + ' - ' + val[1];
        },
        style: {
          //colors: ['#f3f4f5', '#fff']
          colors: ['rgba(0, 0, 0, 0.65)']
        }
      },
      /*xaxis: {
        type: 'datetime'
      },*/
      yaxis: {
        show: false
      },
      grid: {
        row: {
          colors: ['#f3f4f5', '#fff'],
          opacity: 1
        }
      },
      series: [{
        data: []
      }]
    };

    let i = this.data.cursor;
    for(let response of this.data.responses) {
      if(!this.checkResponse(response)) {
        continue;
      }

      let dateRange = getInput(this.data.question.content.componentType, response);

      chartData.series[0].data.push({
        x: rangeTxt + ' ' + ++i,
        y: [
          dateRange[0],
          dateRange[1]
        ],
        //fillColor: '#008FFB'
      });

      count++;
    }

    let chartCnt = $("> .chart", $(this.element.nativeElement))[0];
    let chart = new ApexCharts(chartCnt, chartData);

    return { chart, count };
  }
}
