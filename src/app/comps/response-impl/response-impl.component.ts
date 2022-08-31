import { Component, ElementRef, Input, OnDestroy, OnInit, Type } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicItem } from 'src/app/models/dynamic-item';
import { ListIterator } from 'src/app/models/list-iterator';
import { PaginatorData } from 'src/app/models/paginator-data';
import { QuestionImpl } from 'src/app/models/question-impl';
import { ResponseType, SurveyProps } from 'src/app/models/survey-model';
import { ResponseData, RESPONSE_CLASS, RESPONSE_TYPE } from 'src/app/models/survey-support';
import { SurveyService } from 'src/app/services/survey.service';
import { Web3Service } from 'src/app/services/web3.service';
import { isNumIn, moveScrollTo } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
declare var $: any;

@Component({
  selector: 'response-impl',
  templateUrl: './response-impl.component.html',
  styleUrls: ['./response-impl.component.css']
})
export class ResponseImplComponent implements OnInit, OnDestroy {

  @Input()
  surveyId: number;

  @Input()
  questionIndex: number;

  get surveyProps(): SurveyProps { return this.surveyService.surveyProps; };

  paginatorData: PaginatorData;

  question: QuestionImpl;
  partsNum: number;
  answersNum: number;
  component: Type<any>;
  dynamicItem: DynamicItem;

  loading = true;// waiting onDataLoaded
  loadResponses = false;

  private onChainLoadedRemover: ListenerRemover;

  constructor(
    private element: ElementRef,
    private translateService: TranslateService,
    private web3Service: Web3Service,
    private surveyService: SurveyService
  ) { }

  ngOnInit(): void {
    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadData();
    }, () => {
      return this.web3Service.loadedChainData;
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.onChainLoadedRemover();
  }

  onPageChange(event: any) {
    this.paginatorData = event;
    let comp = this;
    let elt = $(this.element.nativeElement);
    let cnt = $(".response-comp", elt);

    cnt.fadeTo(100, 0.01, function () {
      comp.nextResponseList();
      moveScrollTo(elt, 'top', -10);
      $(this).fadeTo(1000, 1);
    });
  }

  private async firstResponseList() {
    this.paginatorData = {
      page: 0,
      first: 0,
      rows: 5,
      pageCount: Math.ceil(this.partsNum / 5)
    };
    await this.nextResponseList();
  }

  private async nextResponseList() {
    await this.loadResponseList(this.paginatorData.first, this.paginatorData.rows);
  }

  private async loadResponseList(cursor: number, length: number) {
    let responses = [];

    if (cursor + length > this.partsNum) {
      length = this.partsNum - cursor;
    }

    if (length > 0) {
      responses = await this.surveyService.getResponses(this.surveyId, this.questionIndex, cursor, length);
    }

    if(!this.dynamicItem) {
      this.dynamicItem = new DynamicItem(this.component, {
        question: this.question,
        partsNum: this.partsNum,
        responses: responses,
        cursor: cursor
      } as ResponseData);
    } else {
      this.dynamicItem.data.responses = responses;
      this.dynamicItem.data.cursor = cursor;
      (this.dynamicItem.instance as any).loadResponses();
    }

    //this.answersNum = this.partsNum;
  }

  private async loadResponseIterator() {
    this.loadResponses = true;
    const iterator: ListIterator<string[]> = this.surveyService.getResponseIterator(this.surveyId, this.questionIndex, this.partsNum);

    this.dynamicItem = new DynamicItem(this.component, {
      question: this.question,
      partsNum: this.partsNum,
      iterator: iterator,
      onLoaded: (count: number) => {
        setTimeout(() => {
          this.answersNum = count;
          this.loadResponses = false;
        });
      }
    } as ResponseData);
  }

  private async loadData() {
    this.loading = true;

    try {
      this.question = await this.surveyService.getQuestion(this.surveyId, this.questionIndex);
      this.partsNum = await this.surveyService.getParticipantsLength(this.surveyId);

      let responseType = RESPONSE_TYPE[this.question.content.componentType];
      this.component = RESPONSE_CLASS[this.question.content.componentType];

      if (isNumIn(responseType, ResponseType.Text, ResponseType.Range, ResponseType.DateRange)) {
        await this.firstResponseList();
      } else if (isNumIn(responseType, ResponseType.Date)) {
        await this.loadResponseList(0, this.surveyProps.responseMaxPerRequest);
      } else {
        await this.loadResponseIterator();
      }

    } catch (err: any) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
