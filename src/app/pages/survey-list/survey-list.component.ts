import { Component, ElementRef, ViewChild } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { SurveyListState } from 'src/app/models/survey-list-state';
import { SurveyFilter } from 'src/app/models/survey-model';
import { CURRENT_CHAIN } from 'src/app/shared/constants';
import { isEmpty, moveScrollTo } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
declare var $: any;

enum SurveyFilterType {
  OPENED,
  PUBLIC_PART,
  WITH_BUDGET,
  WITH_GAS_RESERVE,
}

const VAPID_PUBLIC_KEY = "BG73DNPCLA6h3awHy1unNvVtbAZVi2dPqMdRlQ0taHaZbCd7_f0am_XYhgF7X89gVkx4agwmlyQsvcuY6dwlt5E";

@Component({
  selector: 'app-survey-list',
  templateUrl: './survey-list.component.html',
  styleUrls: ['./survey-list.component.css']
})
export class SurveyListComponent extends BasePageComponent {

  readonly titleKey = "surveys";
  readonly maxSearchLength = 100;

  state: SurveyListState;
  filters = [];
  surveys: SurveyImpl[] = [];
  results: SurveyImpl[] = [];

  searching = false;
  loading = true;// waiting onDataLoaded
  subscribeEnabled: boolean;
  subscribedUser: boolean;

  //@ViewChild('searchInput') searchInput: ElementRef;

  private onChainLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef,
    private swPush: SwPush
  ) {
    super(element);
    this.state = this.stateService.surveyListState;

    if(!this.state) {
      this.state = this.stateService.createSurveyListState();
    }
  }

  onInit() {
    this.filters = [
      { name: this.translateService.instant("opened"), type: SurveyFilterType.OPENED },
      { name: this.translateService.instant("with_budget"), type: SurveyFilterType.WITH_BUDGET },
      { name: this.translateService.instant("with_gas_reserve"), type: SurveyFilterType.WITH_GAS_RESERVE },
      { name: this.translateService.instant("no_coupon_required"), type: SurveyFilterType.PUBLIC_PART }
    ];

    if(!this.state.selectedFilters) {
      this.state.selectedFilters = [
        /*this.filters[0], */this.filters[1]
      ];
    }

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadData();
    }, () => {
      return this.loadedChainData;
    });

    this.subscribeEnabled = this.swPush.isEnabled;
    
    if(this.subscribeEnabled) {
      navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
        console.log(`geolocation permission status is ${permissionStatus.state}`);
        this.subscribedUser = permissionStatus.state == 'granted';
        permissionStatus.onchange = () => {
          console.log(`geolocation permission status has changed to ${permissionStatus.state}`);
          this.subscribedUser = permissionStatus.state == 'granted';
        };
      });
    }
  }

  onViewLoaded() {
  }

  onDestroy() {
    this.onChainLoadedRemover();
  }

  cleanSearch() {
    this.state.search = '';
    //this.searchInput.nativeElement.focus();
    this.firstList();
  }

  onChangeSearch(event: any) {
    //console.log("onChangeSearch:: " + JSON.stringify(event));
    this.firstList();
  }

  onChangeFilter(event: any) {
    //console.log("onChangeFilter:: " + JSON.stringify(event));
    this.firstList();
  }

  onPageChange(event: any) {
    this.state.paginatorData = event;
    let comp = this;

    $('.survey-list').fadeTo(100, 0.01, function() {
        comp.nextList();
        moveScrollTo('.survey-filter', 'top', -10);
        $(this).fadeTo(1000, 1);
    });
  }

  exploreSurvey(surveyId: number) {
    this.router.navigate(['/surveys/' + surveyId]);
  }

  subscribe() {
    this.swPush.requestSubscription({
      serverPublicKey: VAPID_PUBLIC_KEY
    })
      .then(response => {
        console.log("subscribe response: ", JSON.stringify(response));
        this.utilService.subscribeToNotifications(response, {});// TODO prefs: estaría bien usar algunas preferencias del usuario
      })
      .catch(err => {
        console.error("subscribe error: ", err);
      });
  }

  private async loadData() {
    this.state.surveysLength = await this.surveyService.getSurveysLength();
    await this.firstList();
  }

  private async firstList() {
    this.state.paginatorData.page = 0;
    this.state.paginatorData.first = 0;
    await this.loadList();

    //this.state.paginatorData.pageCount = Math.ceil(this.surveys.length / this.state.paginatorData.rows);
    this.nextList();
  }

  private nextList() {
    let start = this.state.paginatorData.first;
    let end = start + this.state.paginatorData.rows;

    if(end > this.surveys.length) {
      end = this.surveys.length;
    }

    this.results = this.surveys.slice(start, end);
  }

  private async loadList() {
    this.loading = true;
    this.searching = true;

    try {
      this.surveys = [];
      let cursor = this.surveyService.surveyCursor;
      let length = this.maxSearchLength;

      if(length > this.surveyProps.surveyMaxPerRequest) {
        length = this.surveyProps.surveyMaxPerRequest;
      }
  
      if(cursor+length > this.state.surveysLength) {
        length = this.state.surveysLength-cursor;
      }
  
      if(length <= 0) {
        return;
      }

      let text = !isEmpty(this.state.search)? this.state.search: '';
      let onlyOpened = this.state.selectedFilters.some(f => f.type == SurveyFilterType.OPENED);
      let onlyPublic = this.state.selectedFilters.some(f => f.type == SurveyFilterType.PUBLIC_PART);
      let withRmngBudget = this.state.selectedFilters.some(f => f.type == SurveyFilterType.WITH_BUDGET);
      let withGasReserve = this.state.selectedFilters.some(f => f.type == SurveyFilterType.WITH_GAS_RESERVE);
      let minGasReserve = withGasReserve? this.surveyService.minTxGas.toString(): '0';
      let currTime = Math.round(this.web3Service.currenTime / 1000);

      let filter: SurveyFilter = {
        search: text,
        onlyPublic: onlyPublic,
        withRmngBudget: withRmngBudget,
        minStartTime: 0,
        maxStartTime: onlyOpened? currTime: 0,
        minEndTime: onlyOpened? currTime: 0,
        maxEndTime: 0,
        minBudget: '0',
        minReward: '0',
        minGasReserve: minGasReserve
      };

      this.surveys = await this.surveyService.findSurveys(cursor, length, filter);
    } catch (err: any) {
      console.error(err);
    } finally {
      this.loading = false;
      this.searching = false;
    }
  }
}
