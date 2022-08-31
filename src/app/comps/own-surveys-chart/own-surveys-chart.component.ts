import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from 'src/app/app.component';
import { AccountData } from 'src/app/models/account-data';
import { SurveyProps } from 'src/app/models/survey-model';
import { SurveyState } from 'src/app/models/survey-support';
import { SurveyService } from 'src/app/services/survey.service';
import { Web3Service } from 'src/app/services/web3.service';
import { destroyChart, renderChart } from 'src/app/shared/helper';
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
  get surveyProps(): SurveyProps { return this.web3Service.surveyProps; };

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
    if(this.chart) destroyChart(this.chart);
  }

  async loadData() {
    this.loading = true;

    try {
      if (this.chart) {
        destroyChart(this.chart);
        this.chart = undefined;
      }

      let surveysLength = await this.surveyService.getOwnSurveysLength();
      let index = surveysLength - 1;

      let data = [];

      // TODO try to use findOwnSurveys()

      while (index >= 0 && data.length < this.count) {
        let survey = await this.surveyService.getOwnSurvey(index);
        let state = this.surveyService.getState(survey);

        if (state == this.surveyState) {
          //let rmngBudget = await this.surveyService.remainingBudgetOf(survey.id);
          let partsNum = await this.surveyService.getParticipantsLength(survey.id);

          data.push({
            title: survey.title,
            partsNum: partsNum
          });
        }

        index--;
      }

      let tooltipTitle = this.translateService.instant("participations");
      let titleText = (this.surveyState == SurveyState.OPENED) ?
        this.translateService.instant("my_opened_surveys") :
        this.translateService.instant("my_closed_surveys");
      let subtitleText = this.translateService.instant("participations_in_last_x", { val1: this.count });

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
          formatter: function (val, opt) {
            return opt.w.globals.labels[opt.dataPointIndex] + ":  " + val
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
            title: {
              formatter: function () {
                return tooltipTitle + ':';
              }
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
        chartData.series[0].data.push(data[i].partsNum);
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
