import { Component, ElementRef } from '@angular/core';
import { BaseResponseComponent } from '../base-response-component';
declare var ApexCharts: any;
declare var $: any;

@Component({
  selector: 'app-response-rating',
  templateUrl: './response-rating.component.html',
  styleUrls: ['./response-rating.component.css']
})
export class ResponseRatingComponent extends BaseResponseComponent {

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  async onLoadResponses() {
    let { values, count } = this.loadValues();
    let starTxt = this.translateService.instant("star");
    let starsTxt = this.translateService.instant("stars");

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

    for(let i = 1; i <= 5; i++) {
      let label = i + " " + ((i == 1)? starTxt: starsTxt);
      chartData.labels.push(label);
      chartData.series[0].data.push(values[i]?? 0);
    }

    let chartCnt = $("> .chart", $(this.element.nativeElement))[0];
    let chart = new ApexCharts(chartCnt, chartData);

    return { chart, count };
  }
}
