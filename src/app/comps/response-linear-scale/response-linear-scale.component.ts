import { Component, ElementRef } from '@angular/core';
import { BaseResponseComponent } from '../base-response-component';
declare var ApexCharts: any;
declare var $: any;

@Component({
  selector: 'app-response-linear-scale',
  templateUrl: './response-linear-scale.component.html',
  styleUrls: ['./response-linear-scale.component.css']
})
export class ResponseLinearScaleComponent extends BaseResponseComponent {

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

        if(values[response]) {
          values[response]++;
        } else {
          values[response] = 1;
        }

        count++;
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
          borderRadius: 4
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

    for(let i = this.questionData.from; i <= this.questionData.to; i++) {
      chartData.labels.push(i);
      chartData.series[0].data.push(values[i]?? 0);
    }

    let chartCnt = $("> .chart", $(this.element.nativeElement))[0];
    let chart = new ApexCharts(chartCnt, chartData);

    return { chart, count };
  }
}
