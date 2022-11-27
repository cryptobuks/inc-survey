import { Component, ElementRef } from '@angular/core';
import { BaseResponseComponent } from '../base-response-component';
declare var ApexCharts: any;
declare var $: any;

@Component({
  selector: 'app-response-percent',
  templateUrl: './response-percent.component.html',
  styleUrls: ['./response-percent.component.css']
})
export class ResponsePercentComponent extends BaseResponseComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  async onLoadResponses() {
    let labels = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'];
    let values = {};
    let count = 0;
    let total = 0;

    for (let response of this.data.responseCounts) {
      if(!this.checkResponse(response.value)) {
        continue;
      }
      
      let val = parseInt(response.value);
      let index: number;

      if(val < 0 || val > 100) {
        throw new Error("Invalid percent: " + val);
      }

      if(val <= 20) {
        index = 0;
      } else if(val <= 40) {
        index = 1;
      } else if(val <= 60) {
        index = 2;
      } else if(val <= 80) {
        index = 3;
      } else /*if(val <= 100)*/ {
        index = 4;
      }

      if(values[index]) {
        values[index] += response.count;
      } else {
        values[index] = response.count;
      }

      count += response.count
      total += val;
    }

    let totalTxt = this.translateService.instant("total_average");
    let rangeTxt = this.translateService.instant("range");
    let peopleTxt = this.translateService.instant("people");

    let chartData = {
      theme: this.chartTheme,
      chart: {
        background: 'transparent',
        type: 'radialBar',
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: '22px'
            },
            value: {
              fontSize: '16px',
              formatter: function (val) {
                return peopleTxt + ': ' + val + '%';
              }
            },
            total: {
              show: true,
              label: totalTxt,
              formatter: function (w) {
                // By default this function returns the average of all series. The below is just an example to show the use of custom formatter function
                return (total / count).toFixed(2) + '%';
              }
            }
          }
        }
      },
      labels: [],
      series: []
    };

    for(let i = 0; i < 5; i++) {
      let val = values[i]?? 0;
      let percent = (val / count * 100).toFixed(2);

      chartData.labels.push(rangeTxt + ': ' + labels[i]);
      chartData.series.push(percent);
    }

    let chartCnt = $("> .chart", $(this.element.nativeElement))[0];
    let chart = new ApexCharts(chartCnt, chartData);

    return { chart, count };
  }
}
