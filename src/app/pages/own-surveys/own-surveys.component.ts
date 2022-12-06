import { Component, ElementRef } from '@angular/core';
import { PaginatorData } from 'src/app/models/paginator-data';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { moveScrollTo } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
declare var $: any;

@Component({
  selector: 'app-own-surveys',
  templateUrl: './own-surveys.component.html',
  styleUrls: ['./own-surveys.component.css']
})
export class OwnSurveysComponent extends BasePageComponent {

  readonly titleKey = "my_surveys";

  surveys: SurveyImpl[] = [];
  surveysLength: number = 0;

  paginatorData: PaginatorData = {
    page: 0,
    first: 0,
    rows: 12,
    pageCount: 1
  };

  loading = true;// waiting onDataLoaded

  private onChainLoadedRemover: ListenerRemover;
  private onAccountLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef
  ) {
    super(element);
  }

  onInit() {
    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadAccountData();
    }, () => {
      return this.loadedChainData;
    });

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.loadAccountData();
    });
  }

  onViewLoaded() {
  }

  onDestroy() {
    this.onChainLoadedRemover();
    this.onAccountLoadedRemover();
  }

  onPageChange(event: any) {
    this.paginatorData = event;
    let comp = this;

    $('.survey-list-view').fadeTo(100, 0.01, function () {
      comp.nextList();
      moveScrollTo('.survey-list-view', 'top', -10);
      $(this).fadeTo(1000, 1);
    });
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  exploreSurvey(surveyAddr: number) {
    this.router.navigate(['/dashboard/my-surveys/' + surveyAddr]);
  }

  private async loadAccountData() {
    this.surveysLength = await this.surveyService.getOwnSurveysLength();

    if (this.surveysLength == 0) {
      this.backToDashboard();
      return;
    }

    this.firstList();
  }

  private async firstList() {
    this.paginatorData.page = 0;
    this.paginatorData.first = 0;
    //this.paginatorData.pageCount = Math.ceil(this.surveysLength / this.paginatorData.rows);
    await this.nextList();
  }

  private async nextList() {
    await this.loadList(this.paginatorData.first, this.paginatorData.rows);
  }

  private async loadList(cursor: number, length: number) {
    this.loading = true;

    try {
      this.surveys = [];

      if (length > this.configProps.surveyMaxPerRequest) {
        length = this.configProps.surveyMaxPerRequest;
      }

      if (cursor + length > this.surveysLength) {
        length = this.surveysLength - cursor;
      }

      if (length <= 0) {
        return;
      }

      this.surveys = await this.surveyService.getOwnSurveys(cursor, length);
    } catch (err: any) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
