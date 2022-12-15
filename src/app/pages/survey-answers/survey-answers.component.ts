import { Component, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ListIterator } from 'src/app/models/list-iterator';
import { PaginatorData, PaginatorRows } from 'src/app/models/paginator-data';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { getInput } from 'src/app/models/survey-support';
import { SurveyStateInfoService } from 'src/app/services/survey-state-info.service';
import { downloadCSV, equalsIgnoreCase, moveScrollTo, printPage, removeAppCover, setAppCover } from 'src/app/shared/helper';
import { isRouteFromDashboardMyParts, isRouteFromDashboardMySurveys, setBreadcrumbForDetails } from 'src/app/shared/menu';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
declare var $: any;

@Component({
  selector: 'app-survey-answers',
  templateUrl: './survey-answers.component.html',
  styleUrls: ['./survey-answers.component.css'],
  providers:  [ SurveyStateInfoService ]
})
export class SurveyAnswersComponent extends BasePageComponent {

  readonly titleKey = "survey_answers";

  survey: SurveyImpl;
  partsNum: number;
  partAddress: string;
  partEntryTime: string;
  questionIndexes: number[] = [];
  isFromMySurveys: boolean;
  isFromMyParts: boolean;

  selectedTab = 0;
  loading = true;// waiting onDataLoaded
  exporting = false;

  paginatorDataForResumen: PaginatorData = {
    page: 0, 
    first: 0,
    rows: 10,
    pageCount: 1
  };

  paginatorDataForIndividual: PaginatorData = {
    page: 0, 
    first: 0,
    rows: 1,
    pageCount: 1
  };

  paginatorRowsForQuestions: PaginatorRows = {
    value: 10
  };

  get isSurveyOwner(): boolean {
    return equalsIgnoreCase(this.accountData.address, this.survey?.owner);
  }

  private onChainLoadedRemover: ListenerRemover;
  private onAccountLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef,
    private route: ActivatedRoute,
    private surveyStateInfo: SurveyStateInfoService
  ) {
    super(element);
  }

  onInit() {
    let surveyAddr = this.route.snapshot.paramMap.get('address');

    if (!surveyAddr) {
      this.backToList();
      return;
    }

    this.isFromMySurveys = isRouteFromDashboardMySurveys(this.router.url);
    this.isFromMyParts = isRouteFromDashboardMyParts(this.router.url);

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadSurveyData(surveyAddr);
    }, () => {
      return this.loadedChainData;
    });

    this.onAccountLoadedRemover = this.web3Service.onAccountLoaded.add(() => {
      this.checkOwnerRoute();
    });
  }

  onViewLoaded() {
  }

  onDestroy() {
    if (this.onChainLoadedRemover)
      this.onChainLoadedRemover();

    if (this.onAccountLoadedRemover)
      this.onAccountLoadedRemover();
  }

  onPageChangeForResumen(event: any) {
    this.paginatorDataForResumen = event;
    let comp = this;

    $('.resumen-cnt').fadeTo(100, 0.01, function() {
        comp.loadQuestionIndexes();
        moveScrollTo('.resumen-cnt', 'top', -10);
        $(this).fadeTo(1000, 1);
    });
  }

  onPageChangeIndividual(event: any) {
    this.paginatorDataForIndividual = event;
    let comp = this;

    $('.individual-cnt').fadeTo(100, 0.01, function() {
        comp.loadPartData();
        moveScrollTo('.individual-cnt', 'top', -10);
        $(this).fadeTo(1000, 1);
    });
  }

  checkOwnerRoute() {
    if(this.isFromMySurveys && !this.isSurveyOwner) {
      this.router.navigate(['/dashboard/my-surveys']);
      return false;
    }

    return true;
  }

  backToList() {
    if (this.isFromMySurveys) {
      this.router.navigate(['/dashboard/my-surveys']);
    } else if (this.isFromMyParts) {
      this.router.navigate(['/dashboard/my-parts']);
    } else {
      this.router.navigate(['/surveys']);
    }
  }

  backToDetails() {
    if (this.isFromMySurveys) {
      this.router.navigate(['/dashboard/my-surveys/' + this.survey.address]);
    } else if (this.isFromMyParts) {
      this.router.navigate(['/dashboard/my-parts/' + this.survey.address]);
    } else {
      this.router.navigate(['/surveys/' + this.survey.address]);
    }
  }

  printPage() {
    printPage(this.element);
  }

  async exportData() {
    this.exporting = true;

    try {
      setAppCover(this.translateService.instant("please_wait"));
      
      let headers = [];
      let values = [];

      for(let i = 0; i < this.survey.questions.length; i++) {
        let question = this.survey.questions[i];
        headers.push(question.content.title.replace("\"", "\"\""));

        let iterator: ListIterator<string[]> = this.surveyService.getResponseIterator(this.survey.address, i, this.partsNum);
        let j = 0;

        while (iterator.hasNext()) {
          let responses = await iterator.next();
          for (let response of responses) {
            if(!values[j]) {
              values[j] = [];
            }

            let result = response;
            
            if(question.content.componentData.options) {
              result = "";
              let vals = response.split(";");
              
              for(let k = 0; k < vals.length; k++) {
                result += question.content.componentData.options.find(opt => opt.value == vals[k]).label;

                if(k < vals.length - 1) {
                  result += ";";
                }
              }
            }

            values[j][i] = result.replace("\"", "\"\"");
            j++;
          }
        }
      }

      downloadCSV(this.survey.title, headers, values);
    } catch (err: any) {
      this.messageHelperService.showTxError(err);
    } finally {
      removeAppCover();
      this.exporting = false;
    }
  }

  private async loadSurveyData(surveyAddr: string) {
    this.loading = true;

    try {
      this.survey = await this.surveyService.findSurvey(surveyAddr);

      // this should not happen with added validation
      if (!this.survey?.address) {
        this.backToList();
        return;
      }

      this.partsNum = await this.surveyService.getParticipantsLength(surveyAddr);

      if (this.partsNum == 0) {
        this.backToList();
        return;
      }

      if(!this.checkOwnerRoute()) {
        return;
      }

      let questionsNum = await this.surveyService.getQuestionsLength(surveyAddr);
      // SurveyBase.questionMaxPerRequest = SurveyValidator.questionMaxPerSurvey
      this.survey.questions = await this.surveyService.getQuestions(surveyAddr, 0, questionsNum);
      
      await this.surveyStateInfo.loadData(this.survey);
      await this.loadPartData();

      this.loadQuestionIndexes();
      setBreadcrumbForDetails(this.router, surveyAddr, this.survey.title);

    } catch (err: any) {
      console.error(err);
      this.backToList();
    } finally {
      this.loading = false;
    }
  }

  private loadQuestionIndexes() {
    this.questionIndexes = [];
    let start = this.paginatorDataForResumen.first;
    let end = start + this.paginatorDataForResumen.rows;

    if(end > this.survey.questions.length) {
      end = this.survey.questions.length;
    }

    for(let i = start; i < end; i++) {
      this.questionIndexes.push(i);
    }
  }

  private async loadPartData() {
    this.loading = true;

    try {
      let part = await this.surveyService.getParticipation(this.survey.address, this.paginatorDataForIndividual.first);

      // this should not happen with added validation
      if (!part?.surveyAddr) {
        this.backToDetails();
        return;
      }

      this.partAddress = part.partOwner;
      this.partEntryTime = new Date(part.partTime * 1000).toLocaleString();

      for(let i = 0; i < this.survey.questions.length; i++) {
        let question = this.survey.questions[i];
        let response = part.responses[i];
        question.response.input = getInput(question.content.componentType, response);
      }

    } catch (err: any) {
      console.error(err);
      this.backToDetails();
    } finally {
      this.loading = false;
    }
  }
}
