import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from 'src/app/app.component';
import { AccountData } from 'src/app/models/account-data';
import { SurveyService } from 'src/app/services/survey.service';
import { Web3Service } from 'src/app/services/web3.service';
import { DAY_MILLIS, DAY_SECONDS, HOUR_MILLIS, HOUR_SECONDS, MINUTE_SECONDS, MONTH_MILLIS, MONTH_SECONDS, WEEK_MILLIS, YEAR_MILLIS } from 'src/app/shared/constants';
import { destroyChart, renderChart, toChecksumAddress } from 'src/app/shared/helper';
declare var $: any;
declare var ApexCharts: any;

@Component({
  selector: 'survey-timeline',
  templateUrl: './survey-timeline.component.html',
  styleUrls: ['./survey-timeline.component.css']
})
export class SurveyTimelineComponent implements OnInit, OnDestroy {

  private readonly maxLength = 100;
  
  get accountData(): AccountData { return this.web3Service.accountData; };

  chart: any;
  option: number;
  loading = true;

  constructor(
    public element: ElementRef,
    private translateService: TranslateService,
    private web3Service: Web3Service,
    private surveyService: SurveyService
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
    await this.loadYear();
  }

  async loadHour() {
    let startTime = Math.round((this.web3Service.currenTime - HOUR_MILLIS) / 1000);
    let endTime = Math.round(this.web3Service.currenTime / 1000);
    let granularity = MINUTE_SECONDS * 5;
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
    let granularity = HOUR_SECONDS * 8;
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

  private async loadData(startTime: number, endTime: number, granularity: number) {
    this.loading = true;

    try {
      if (this.chart) {
        destroyChart(this.chart);
        this.chart = undefined;
      }
      
      let totalTime = endTime - startTime;
      let length = Math.ceil(totalTime / granularity);
      if (length > this.maxLength) {
        length = this.maxLength;
        granularity = Math.floor(totalTime / length);
      }
  
      let result = await this.surveyService.findPartsOnServer({
        surveyOwner: toChecksumAddress(this.accountData.address),
        startTime,
        endTime,
        granularity,
        surveyFields: [ "surveyAddr", "title" ]
      });

      let surveyTitleMap: { [address: string]: string } = {};

      for (let survey of result.surveys) {
        surveyTitleMap[survey.address] = survey.title;
      }
  
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
        stroke: {//straight
          curve: 'smooth'
        },
        markers: {
          size: 1
        },
        title: {
          text: this.translateService.instant('my_surveys_over_time'),
          align: 'left'
        },
        subtitle: {
          text: this.translateService.instant('participations_in_selected_range'),
          align: 'left'
        },
        xaxis: {
          type: 'datetime',
          categories: []
        },
        /*yaxis: {
          opposite: true
        },*/
        legend: {
          horizontalAlign: 'left'
        },
        /*tooltip: {
          x: {
            //format: 'dd/MM/yy HH:mm'
            format: 'dd/MM/yy HH'
          },
          custom: function({ series, seriesIndex, dataPointIndex, w }) {
            let value = series[seriesIndex][dataPointIndex];
            return (
              '<label>xxx :</label>' +
              '<span>' + value + '</span>'
            );
          }
        },*/
        tooltip: {
          x: {
            format: 'MM/dd/yyyy HH:mm'
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
        series: [],
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

      for (let i = 0; i < result.buckets?.length; i++) {
        let bucket = result.buckets[i];
        let serie = {
          name: surveyTitleMap[bucket.key],
          data: []
        };

        for (let j = 0; j < bucket.timeline?.values.length; j++) {
          if (i == 0) {
            let time = bucket.timeline.times[j] * 1000;
            chartData.xaxis.categories.push(time);
          }

          let value = bucket.timeline.values[j];
          serie.data.push(value);
        }

        chartData.series.push(serie);
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
