import { Component, ElementRef } from '@angular/core';
import { BaseResponseComponent } from '../base-response-component';
declare var ApexCharts: any;
declare var $: any;

@Component({
  selector: 'app-response-checks',
  templateUrl: './response-checks.component.html',
  styleUrls: ['./response-checks.component.css']
})
export class ResponseChecksComponent extends BaseResponseComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  async onLoadResponses() {
    let values = {};
    let count = 0;

    while(this.data.iterator.hasNext()) {
      let responses = await this.data.iterator.next();

      for(let response of responses) {
        if(!this.checkResponse(response)) {
          continue;
        }

        let vals = response.split(";");

        for(let val of vals) {
          if(values[val]) {
            values[val]++;
          } else {
            values[val] = 1;
          }

          count++;
        }
      }
    }

    let chartData = {
      theme: this.chartTheme,
      chart: {
        background: 'transparent',
        type: 'bar',
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          if(val == 0) {
            return '';
          }
          let percent = (val / count * 100).toFixed(2);
          return percent + "%";
        }
      },
      labels: [],
      series: [{
        name: "",// To avoid Series 1: x as label
        data: []
      }]
    };

    for(let option of this.questionData.options) {
      chartData.labels.push(option.label);
      chartData.series[0].data.push(values[option.value]?? 0);
    }

    let chartCnt = $("> .chart", $(this.element.nativeElement))[0];
    let chart = new ApexCharts(chartCnt, chartData);

    return { chart, count };
  }
}
