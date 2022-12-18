import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from 'src/app/app.component';
import { AccountData } from 'src/app/models/account-data';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { ConfigProps } from 'src/app/models/survey-model';
import { SurveyService } from 'src/app/services/survey.service';
import { Web3Service } from 'src/app/services/web3.service';
import { YEAR_SECONDS } from 'src/app/shared/constants';
import { destroyChart, renderChart, toAmount, toChecksumAddress, toFormatBigNumber } from 'src/app/shared/helper';
declare var $: any;
declare var ApexCharts: any;

@Component({
  selector: 'own-parts-chart',
  templateUrl: './own-parts-chart.component.html',
  styleUrls: ['./own-parts-chart.component.css']
})
export class OwnPartsChartComponent implements OnInit, OnDestroy {

  private readonly count = 10;

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

    try {
      if (this.chart) {
        destroyChart(this.chart);
        this.chart = undefined;
      }

      let currTime = Math.round(this.web3Service.currenTime / 1000);
      let startTime = currTime - YEAR_SECONDS;

      let result = await this.surveyService.findPartsOnServer({
        startTime,
        partOwner: toChecksumAddress(this.accountData.address),
        surveyFields: ["surveyAddr", "title", "reward", "tokenSymbol"]
      });

      let surveyMap: { [address: string]: SurveyImpl } = {};

      for (let survey of result.surveys) {
        surveyMap[survey.address] = survey;
      }

      let data = [];

      for (let i = 0; i < result.buckets?.length; i++) {
        let bucket = result.buckets[i]; // bucket.count will always be 1
        let survey = surveyMap[bucket.key];

        data.push({
          title: survey.title,
          value: toFormatBigNumber(toAmount(survey.reward)),
          symbol: survey.tokenData.symbol
        });
      }

      let tooltipTitle = this.translateService.instant("reward");
      let titleText = this.translateService.instant("my_participations");
      let subtitleText = this.translateService.instant("earnings_in_last_x", { val1: this.count });

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
          // formatter: function(value, { seriesIndex, dataPointIndex, w })
          formatter: function (value, opts) {
            //return opts.w.globals.labels[opts.dataPointIndex] + ":  " + value
            return data[opts.dataPointIndex].title + ':' + value + ' ' + data[opts.dataPointIndex].symbol;
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
            // formatter: function(value, { series, seriesIndex, dataPointIndex, w })
            formatter: function (value, opts) {
              return tooltipTitle + ':' + value + ' ' + data[opts.dataPointIndex].symbol;
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
