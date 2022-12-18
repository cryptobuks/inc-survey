import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from 'src/app/app.component';
import { AccountData } from 'src/app/models/account-data';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { ConfigProps } from 'src/app/models/survey-model';
import { SurveyState } from 'src/app/models/survey-support';
import { SurveyService } from 'src/app/services/survey.service';
import { Web3Service } from 'src/app/services/web3.service';
import { calcPecent, destroyChart, formatDuration, limitStr, renderChart, toChecksumAddress } from 'src/app/shared/helper';
declare var $: any;
declare var ApexCharts: any;

@Component({
  selector: 'own-surveys-chart',
  templateUrl: './own-surveys-chart.component.html',
  styleUrls: ['./own-surveys-chart.component.css']
})
export class OwnSurveysChartComponent implements OnInit, OnDestroy {

  private readonly count = 10;

  @Input()
  surveyState: SurveyState;

  get accountData(): AccountData { return this.web3Service.accountData; };
  get configProps(): ConfigProps { return this.web3Service.configProps; };

  chart: any;
  loading = true;

  constructor(
    public element: ElementRef,
    private translateService: TranslateService,
    private web3Service: Web3Service,
    private surveyService: SurveyService
  ) {
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if (this.chart) destroyChart(this.chart);
  }

  async loadData() {
    this.loading = true;
    let isOpened = this.surveyState == SurveyState.OPENED;

    try {
      if (this.chart) {
        destroyChart(this.chart);
        this.chart = undefined;
      }

      let currTime = Math.round(this.web3Service.currenTime / 1000);
      let surveyMinStartTime = undefined, surveyMaxStartTime = undefined,
      surveyMinEndTime = undefined, surveyMaxEndTime = undefined;

      if (isOpened) {
        surveyMaxStartTime = currTime;
        surveyMinEndTime = currTime - 1;
      } else {// CLOSED
        surveyMaxEndTime = currTime;
      }

      let result = await this.surveyService.findPartsOnServer({
        surveyOwner: toChecksumAddress(this.accountData.address),
        surveyMinStartTime,
        surveyMaxStartTime,
        surveyMinEndTime,
        surveyMaxEndTime,
        surveyFields: ["surveyAddr", "title", "startTime", "endTime"],
        sortItems: [
          {
            field: 'startTime',
            order: 'desc'
          }
        ]
      });

      let surveyMap: { [address: string]: SurveyImpl } = {};

      for (let survey of result.surveys) {
        surveyMap[survey.address] = survey;
      }

      let progressTxt = this.translateService.instant("progress");
      let durationTxt = this.translateService.instant("duration");
      let elapsedTimeTxt = this.translateService.instant("elapsed_time");
      let participationsTxt = this.translateService.instant("participations");
      let titleText = isOpened ?
        this.translateService.instant("my_opened_surveys") :
        this.translateService.instant("my_closed_surveys");
      let subtitleText = isOpened ?
        this.translateService.instant("number_participations_so_far"):
        this.translateService.instant("total_participations");

      let data = [];
      let currTimeMs = this.web3Service.currenTime;

      for (let i = 0; i < result.buckets?.length; i++) {
        let bucket = result.buckets[i];
        let survey = surveyMap[bucket.key];
        let startMs = survey.startDate.getTime();
        let endMs = survey.endDate.getTime();
        let duration = formatDuration(endMs - startMs - 1000);

        let limitedTitle = limitStr(survey.title, 64);
        let label = limitedTitle + ": " + bucket.count + " P";

        let tooltip: string;
        let value: number;

        if(isOpened) {
          let progress = currTimeMs - startMs;
          let total = endMs - startMs - 1000;
          value = calcPecent(progress, total);
          let elapsed = formatDuration(currTimeMs - startMs);
          tooltip = `${progressTxt}: ${value}%\n${elapsedTimeTxt}: ${elapsed}\n${durationTxt}: ${duration}\n${participationsTxt}: ${bucket.count}`;
        } else {
          value = bucket.count;
          tooltip = `${durationTxt}: ${duration}\n${participationsTxt}: ${bucket.count}`;
        }

        data.push({
          title: survey.title,
          label,
          tooltip,
          value
        });
      }

      let chartData = {
        theme: AppComponent.instance.chartTheme,
        chart: {
          background: 'transparent',
          type: 'bar',
          width: '100%',
          height: 380,
          toolbar: {
            tools: {
              download: false
            }
          }
        },
        plotOptions: {
          bar: {
            barHeight: '100%',
            distributed: true,
            horizontal: true,
            dataLabels: {
              position: 'bottom'
            },
          }
        },
        colors: [
          '#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B',
          '#2b908f', '#f9a3a4', '#90ee7e', '#f48024', '#69d2e7'
        ],
        dataLabels: {
          enabled: true,
          textAnchor: 'start',
          style: {
            colors: ['#fff']
          },
          formatter: function (value, opts) {
            //return opts.w.globals.labels[opts.dataPointIndex] + ":  " + value;
            return data[opts.dataPointIndex].label;
          },
          offsetX: 0,
          dropShadow: {
            enabled: true
          }
        },
        stroke: {
          width: 1,
          colors: ['#fff']
        },
        xaxis: {
          categories: [],
          max: isOpened? 100: undefined,
          labels: {
            formatter: function(value, timestamp, opts) {
              return value + (isOpened? '%': '');
            }
          }
        },
        yaxis: {
          labels: {
            show: false
          }
        },
        title: {
          text: titleText,
          align: 'center',
          floating: true
        },
        subtitle: {
          text: subtitleText,
          align: 'center',
        },
        tooltip: {
          theme: 'dark',
          x: {
            show: false
          },
          y: {
            /*title: {
              formatter: function () {
                return tooltipTitle + ':';
              }
            },*/
            //formatter: function(value, { series, seriesIndex, dataPointIndex, w })
            formatter: function(value, opts) {
              return data[opts.dataPointIndex].tooltip;
            }
          }
        },
        /*responsive: [
          {
            breakpoint: 767,
            options: {
              plotOptions: {
                bar: {
                  horizontal: false
                }
              },
              dataLabels: {
                enabled: false
              }
            }
          }
        ],*/
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
  
      if (chartData.chart.width > winWidth) {
        chartData.chart.width = winWidth - 28;
      }*/

      for (let i = 0; i < data.length; i++) {
        chartData.xaxis.categories.push(data[i].title);
        chartData.series[0].data.push(data[i].value);
      }

      $(".loading-cnt", $(this.element.nativeElement)).hide();

      //if (!this.chart) {
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
