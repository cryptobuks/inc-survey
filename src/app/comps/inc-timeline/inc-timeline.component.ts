import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import BigNumber from 'bignumber.js';
import { AppComponent } from 'src/app/app.component';
import { AccountData } from 'src/app/models/account-data';
import { IncProps, Timeline } from 'src/app/models/inc-model';
import { Web3Service } from 'src/app/services/web3.service';
import { DAY_MILLIS, DAY_SECONDS, HOUR_MILLIS, HOUR_SECONDS, MINUTE_SECONDS, MONTH_MILLIS, MONTH_SECONDS, WEEK_MILLIS, YEAR_MILLIS, YEAR_SECONDS } from 'src/app/shared/constants';
import { destroyChart, renderChart, toAmount, toFormatBigNumber } from 'src/app/shared/helper';
declare var $: any;
declare var ApexCharts: any;

@Component({
  selector: 'inc-timeline',
  templateUrl: './inc-timeline.component.html',
  styleUrls: ['./inc-timeline.component.css']
})
export class IncTimelineComponent implements OnInit, OnDestroy {

  get incContract(): any { return this.web3Service.incContract; };
  get accountData(): AccountData { return this.web3Service.accountData; };
  get incProps(): IncProps { return this.web3Service.incProps; };

  chart: any;
  option: number;
  loading = true;

  constructor(
    public element: ElementRef,
    private translateService: TranslateService,
    private web3Service: Web3Service
  ) {
  }

  ngOnInit() {
    this.loadDefault();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if(this.chart) destroyChart(this.chart);
  }

  async loadDefault() {
    await this.loadAll();
  }

  async loadHour() {
    let startTime = Math.round((this.web3Service.currenTime - HOUR_MILLIS) / 1000);
    let endTime = Math.round(this.web3Service.currenTime / 1000);
    let granularity = MINUTE_SECONDS;
    await this.loadData(startTime, endTime, granularity);
    this.option = 1;
  }

  async loadDay() {
    let startTime = Math.round((this.web3Service.currenTime - DAY_MILLIS) / 1000);
    let endTime = Math.round(this.web3Service.currenTime / 1000);
    let granularity = HOUR_SECONDS;
    await this.loadData(startTime, endTime, granularity);
    this.option = 2;
  }

  async loadWeek() {
    let startTime = Math.round((this.web3Service.currenTime - WEEK_MILLIS) / 1000);
    let endTime = Math.round(this.web3Service.currenTime / 1000);
    let granularity = HOUR_SECONDS;
    await this.loadData(startTime, endTime, granularity);
    this.option = 3;
  }

  async loadMonth() {
    let startTime = Math.round((this.web3Service.currenTime - MONTH_MILLIS) / 1000);
    let endTime = Math.round(this.web3Service.currenTime / 1000);
    let granularity = DAY_SECONDS;
    await this.loadData(startTime, endTime, granularity);
    this.option = 4;
  }

  async loadYear() {
    let startTime = Math.round((this.web3Service.currenTime - YEAR_MILLIS) / 1000);
    let endTime = Math.round(this.web3Service.currenTime / 1000);
    let granularity = MONTH_SECONDS;
    await this.loadData(startTime, endTime, granularity);
    this.option = 5;
  }

  async loadAll() {
    let startTime = parseInt(await this.incContract.methods.timelineStartOf(this.accountData.address).call());
    if(!startTime) {
      startTime = Math.round(this.web3Service.currenTime / 1000);
    }

    startTime -= DAY_SECONDS;
    let endTime = Math.round(this.web3Service.currenTime / 1000);
    let totalTime = endTime - startTime;
    let granularity: number;

    if(totalTime >= YEAR_SECONDS) {
      granularity = MONTH_SECONDS;
    } else if(totalTime >= MONTH_SECONDS) {
      granularity = DAY_SECONDS;
    } else if(totalTime >= DAY_SECONDS) {
      granularity = HOUR_SECONDS;
    } else {
      granularity = MINUTE_SECONDS;
    }

    await this.loadData(startTime, endTime, granularity);
    this.option = 6;
  }

  private async loadData(startTime: number, endTime: number, granularity: number) {
    this.loading = true;

    try {
      if (this.chart) {
        destroyChart(this.chart);
        this.chart = undefined;
      }
      
      let totalTime = endTime - startTime;
      let length = Math.ceil(totalTime / granularity);
      if(length > this.incProps.timelineMaxPerRequest) {// This is not going to happen
        granularity = Math.round(totalTime / (this.incProps.timelineMaxPerRequest / 2));
      }
  
      let timeline: Timeline = await this.incContract.methods.timelineMetricsOf(this.accountData.address, startTime, endTime, granularity).call();
  
      let chartData = {
        theme: AppComponent.instance.chartTheme,
        chart: {
          background: 'transparent',
          type: 'area',
          width: '100%',
          height: 360,
          zoom: {
            enabled: false
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
        stroke: {//smooth
          curve: 'straight'
        },
        title: {
          text: this.translateService.instant('x_timeline', { val1: 'INC' }),
          align: 'left'
        },
        subtitle: {
          text: this.translateService.instant('balance_movements'),
          align: 'left'
        },
        xaxis: {
          type: 'datetime',
          categories: []
        },
        yaxis: {
          opposite: true
        },
        legend: {
          horizontalAlign: 'left'
        },
        tooltip: {
          x: {
            //format: 'dd/MM/yy HH:mm'
            format: 'dd/MM/yy HH'
          },
          custom: function({ series, seriesIndex, dataPointIndex, w }) {
            let balance = series[seriesIndex][dataPointIndex];
            return (
              '<label>INC:</label>' +
              '<span>' + toFormatBigNumber(new BigNumber(balance)) + '</span>'
            );
          }
        },
        responsive: [
          {
            breakpoint: 767,
            options: {
              plotOptions: {
                bar: {
                  horizontal: false
                }
              },
              chart: {
                width: '100%'
              }
            }
          }
        ],
        series: [{
          name: '',
          data: []
        }],
        noData: {
          text: this.translateService.instant("no_data"),
          align: "center",
          verticalAlign: "middle",
          style: {
            color: "#6366f1",
            fontSize: '18px',
            //fontFamily: undefined
          }
        }
      };
  
      /*let winWidth = $(window).width() - 40;
  
      if(chartData.chart.width > winWidth) {
        chartData.chart.width = winWidth - 28;
      }*/
  
      for(let i = 0; i < timeline.times.length; i++) {
        let time = timeline.times[i] * 1000;
        let balance = toAmount(timeline.balances[i]);
        chartData.xaxis.categories.push(time);
        chartData.series[0].data.push(balance);
      }

      $(".loading-cnt", $(this.element.nativeElement)).hide();

      //if(!this.chart) {
        let chartCnt = $(".chart", $(this.element.nativeElement))[0];
        this.chart = new ApexCharts(chartCnt, chartData);
        renderChart(this.chart);
      /*} else {
        this.chart.updateOptions({
          xaxis: {
            categories: chartData.xaxis.categories
          }
        });
        this.chart.updateSeries(chartData.series);
      }*/
    } finally {
      this.loading = false;
    }
  }
}
