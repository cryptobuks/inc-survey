import { Component, ElementRef } from '@angular/core';
import { PaginatorData, PaginatorRows } from 'src/app/models/paginator-data';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { getInput } from 'src/app/models/survey-support';
import { moveScrollTo, printPage } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
declare var $: any;

@Component({
  selector: 'app-own-parts',
  templateUrl: './own-parts.component.html',
  styleUrls: ['./own-parts.component.css']
})
export class OwnPartsComponent extends BasePageComponent {

  readonly titleKey = "my_participations";

  survey: SurveyImpl;
  partsNum: number;
  partEntryTime: string;

  paginatorData: PaginatorData = {
    page: 0, 
    first: 0,
    rows: 1,
    pageCount: 1
  };

  paginatorRowsForQuestions: PaginatorRows = {
    value: 10
  };

  loading = true;// waiting onDataLoaded

  private onChainLoadedRemover: ListenerRemover;
  private onAccountLoadedRemover: ListenerRemover;

  constructor(element: ElementRef) {
    super(element);
  }

  onInit() {
    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadData();
    }, () => {
      return this.loadedChainData;
    });

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.loadData();
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

    $('.part-list').fadeTo(100, 0.01, function () {
      comp.loadPartData();
      moveScrollTo('.part-list', 'top', -10);
      $(this).fadeTo(1000, 1);
    });
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  showSurveyDetails() {
    this.router.navigate(['/dashboard/my-parts/' + this.survey.address]);
  }

  printPage() {
    printPage(this.element);
  }

  private async loadData() {
    this.partsNum = await this.surveyService.getOwnParticipationsLength();

    if (this.partsNum == 0) {
      this.backToDashboard();
      return;
    }

    await this.loadPartData();
  }

  private async loadPartData() {
    this.loading = true;

    try {
      let part = await this.surveyService.getOwnParticipation(this.paginatorData.first);

      // this should not happen with added validation
      if (!part?.surveyAddr) {
        this.backToDashboard();
        return;
      }

      this.survey = await this.surveyService.findSurvey(part.surveyAddr);
      let questionsNum = await this.surveyService.getQuestionsLength(part.surveyAddr);
      // SurveyBase.questionMaxPerRequest = SurveyValidator.questionMaxPerSurvey
      this.survey.questions = await this.surveyService.getQuestions(part.surveyAddr, 0, questionsNum);
      this.partEntryTime = new Date(part.entryTime * 1000).toLocaleString();

      for(let i = 0; i < this.survey.questions.length; i++) {
        let question = this.survey.questions[i];
        let response = part.responses[i];
        question.response.input = getInput(question.content.componentType, response);
      }

    } catch (err: any) {
      console.error(err);
      this.backToDashboard();
    } finally {
      this.loading = false;
    }
  }
}
