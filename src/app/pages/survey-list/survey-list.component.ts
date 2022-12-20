import { Component, ElementRef, ViewChild } from '@angular/core';
import { SurveyFilter } from 'src/app/models/survey-filter';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { SurveyListState } from 'src/app/models/survey-list-state';
import { ADDRESS_ZERO } from 'src/app/shared/constants';
import { isEmpty, moveScrollTo } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
declare var $: any;

enum SurveyFilterType {
  OPENED,
  PUBLIC_PART
}

@Component({
  selector: 'app-survey-list',
  templateUrl: './survey-list.component.html',
  styleUrls: ['./survey-list.component.css']
})
export class SurveyListComponent extends BasePageComponent {

  readonly titleKey = "surveys";

  state: SurveyListState;
  filters = [];
  surveys: SurveyImpl[] = [];
  loading = true;// waiting onDataLoaded

  @ViewChild('searchInput') searchInput: ElementRef;

  private onChainLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef
  ) {
    super(element);
    this.state = this.stateService.surveyListState;

    if(!this.state) {
      this.state = this.stateService.createSurveyListState();
      this.state.search = '';
    }
  }

  onInit() {
    this.filters = [
      { name: this.translateService.instant("opened"), type: SurveyFilterType.OPENED },
      { name: this.translateService.instant("no_coupon_required"), type: SurveyFilterType.PUBLIC_PART }
    ];

    if(!this.state.selectedFilters) {
      this.state.selectedFilters = [
        //this.filters[0]
      ];
    }

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadChainData();
    }, () => {
      return this.loadedChainData;
    });
  }

  onViewLoaded() {
  }

  onDestroy() {
    this.onChainLoadedRemover();
    this.stateService.saveSurveyListState();
  }

  cleanSearch() {
    this.state.search = '';
    this.searchInput.nativeElement.focus();
    this.firstList();
  }

  onChangeSearch(event: any) {
    //console.log("onChangeSearch:: " + JSON.stringify(event));
    this.state.search = this.state.search.trim();
    if(this.state.search.length == 0 || this.state.search.length >= 4) {
      this.firstList();
    }
  }

  onChangeFilter(event: any) {
    //console.log("onChangeFilter:: " + JSON.stringify(event));
    this.firstList();
  }

  onPageChange(event: any) {
    this.state.paginatorData = event;
    let comp = this;

    $('.survey-list-view').fadeTo(100, 0.01, function() {
        comp.loadList();
        moveScrollTo('.survey-filter', 'top', -10);
        $(this).fadeTo(1000, 1);
    });
  }

  exploreSurvey(surveyAddr: number) {
    this.router.navigate(['/surveys/' + surveyAddr]);
  }

  private async loadChainData() {
    await this.firstList();
  }

  private async firstList() {
    this.state.paginatorData.page = 0;
    this.state.paginatorData.first = 0;
    await this.loadList();
  }

  private async loadList() {
    this.loading = true;

    try {
      this.surveys = [];
      let cursor = this.state.paginatorData.first;
      let length = this.state.paginatorData.rows;

      let text = !isEmpty(this.state.search)? this.state.search: '';
      let onlyOpened = this.state.selectedFilters.some(f => f.type == SurveyFilterType.OPENED);
      let onlyPublic = this.state.selectedFilters.some(f => f.type == SurveyFilterType.PUBLIC_PART);
      let currTime = Math.round(this.web3Service.currenTime / 1000);

      let filter: SurveyFilter = {
        cursor,
        length,
        search: text,
        onlyPublic: onlyPublic,
        maxStartTime: onlyOpened? currTime: 0,
        minEndTime: onlyOpened? currTime - 1: 0,
        //token: ADDRESS_ZERO,// TODO <- add filter
        sortItems: [
          {
            field: 'surveyTime',
            order: 'desc'
          },
          {
            field: 'rewardEther',
            order: 'desc'
          }
        ]
      };

      const result = await this.surveyService.findSurveysOnServer(filter);
      this.surveys = result.surveys;
      this.state.surveysTotal = result.total;
    } catch (err: any) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
