import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AccountData } from 'src/app/models/account-data';
import { DynamicItem } from 'src/app/models/dynamic-item';
import { PaginatorData, PaginatorRows } from 'src/app/models/paginator-data';
import { QuestionImpl } from 'src/app/models/question-impl';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { QuestionValidator, ResponseType, ValidationExpression, ValidationOperator, EngineProps } from 'src/app/models/survey-model';
import { QUESTION_CLASS, QuestionData, RESPONSE_TYPE } from 'src/app/models/survey-support';
import { IpfsService } from 'src/app/services/ipfs.service';
import { SurveyService } from 'src/app/services/survey.service';
import { Web3Service } from 'src/app/services/web3.service';
import { CURRENT_CHAIN, NATIVE_CURRENCY, DOMAIN_URL, HOUR_MILLIS } from 'src/app/shared/constants';
import { calcFeeTotal, containsDigits, exportCoupons, insertValidationError, isDigit, isUDigit, loadPageList, moveScrollTo, ScrollPosition, truncateSeconds } from 'src/app/shared/helper';
declare var $: any;

@Component({
  selector: 'survey-impl',
  templateUrl: './survey-impl.component.html',
  styleUrls: ['./survey-impl.component.css']
})
export class SurveyImplComponent implements OnInit, OnDestroy {
  
  @Input()
  survey: SurveyImpl;

  @Input()
  showDetails: boolean = true;

  @Input()
  showLogoUrl: boolean = false;

  @Input()
  showLocation: boolean = false;

  @Input()
  showKeys: boolean = false;

  @Input()
  showQuestions: boolean = true;

  @Input()
  showQuestionsHead: boolean = true;

  @Input()
  showQuestionsNum: boolean = false;
  
  @Input()
  questionsNum: number;

  @Input()
  showMaxParts: boolean = false;

  @Input()
  gasReserve: string;

  @Input()
  engineRate: string;

  @Input()
  totalToPay: string;

  @Input()
  disabledQuestions: boolean = false;

  @Input()
  paginatorRows: PaginatorRows = {
      value: 10
  };

  get currSymbol(): string { return NATIVE_CURRENCY[CURRENT_CHAIN].symbol; }
  get accountData(): AccountData { return this.web3Service.accountData; };
  get engineProps(): EngineProps { return this.surveyService.engineProps; };
  get surveyLocation(): string {
      return DOMAIN_URL + '/surveys/' + this.survey.id;
  }
  get maxParts(): number {
    return this.survey.budget.dividedBy(this.survey.reward).toNumber();
  }
  get showCostInfo(): boolean {
    return this.gasReserve != undefined || this.engineRate != undefined || this.totalToPay != undefined;
  }

  imageSrc: string;
  questionItems: DynamicItem[] = [];
  pageQuestions: QuestionImpl[] = [];

  paginatorData: PaginatorData = {
    page: 0, 
    first: 0,
    rows: 10,
    pageCount: 1
  };

  savedKeys = false;

  constructor(
    private translateService: TranslateService,
    private web3Service: Web3Service,
    private surveyService: SurveyService,
    private ipfsService: IpfsService
  ) {
  }

  ngOnInit() {
    this.paginatorData.rows = this.paginatorRows.value;
    SurveyImpl.formatData(this.survey);
    this.loadImageSrc();
    this.loadPage();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
  }

  exportKeys() {
    exportCoupons(this.survey.partKeys);
    this.savedKeys = true;
  }
  
  onPageChange(event: any) {
    this.paginatorData = event;
    this.paginatorRows.value = event.rows;
    let comp = this;

    $('.question-list').fadeTo(100, 0.01, function() {
        comp.loadPage();
        moveScrollTo('.question-list', 'top', -10);
        $(this).fadeTo(1000, 1);
    });
  }

  getQuestionItem(index: number) {
    return this.questionItems[index];
  }

  async loadImageSrc() {
    this.imageSrc = await this.ipfsService.surveyLogo(this.survey);
  }

  validateSurvey(): [string, string] {
    let currTime = truncateSeconds(new Date(this.web3Service.currenTime)).getTime();

    if(this.survey.startDate.getTime() < currTime + HOUR_MILLIS) {
      return [".survey-start-date", this.translateService.instant("start_date_must_after_current_date_at_least_1_hour")];
    }

    if(this.survey.startDate.getTime() - currTime > this.engineProps.startMaxTime * 1000) {
      return [".survey-start-date", this.translateService.instant("invalid_start_date_max_x_days", { val1: Math.round(this.engineProps.startMaxTime / 60 / 60 / 24) })];
    }

    if(this.survey.endDate.getTime() < this.survey.startDate.getTime() + this.engineProps.rangeMinTime * 1000) {
      return [".survey-end-date", this.translateService.instant("invalid_date_range_min_x_hours", { val1: Math.round(this.engineProps.rangeMinTime / 60 / 60 ) })];
    }

    if(this.survey.endDate.getTime() - this.survey.startDate.getTime() > this.engineProps.rangeMaxTime * 1000) {
      return [".survey-end-date", this.translateService.instant("invalid_date_range_max_x_days", { val1: Math.round(this.engineProps.rangeMaxTime / 60 / 60 / 24) })];
    }

    if(this.survey.budget.isGreaterThan(this.accountData.incBalance)) {
        return [".survey-budget", this.translateService.instant("budget_exceeds_your_x_balance", { val1: 'INC' })];
    }

    let totalFee = calcFeeTotal(this.survey.budget, this.survey.reward, this.engineProps.feeWei);
    let weiAmount = this.survey.gasReserve.plus(totalFee);

    if (weiAmount.isGreaterThan(this.accountData.ccyBalance)) {
        return [".survey-total-pay", this.translateService.instant("insufficient_x_balance", { val1: this.currSymbol })];
    }

    if(this.survey.partKeys && this.survey.partKeys.length > 0 && !this.savedKeys) {
        return [".survey-keys-error", this.translateService.instant("export_your_coupons")];
    }

    return null;
  }

  getResponses(): string[] {
    let responses = [];

    for(let i = 0; i < this.survey.questions.length; i++) {
        let question = this.survey.questions[i];
        // There will be no method output() if the user has not visited the component.
        let response = question.response.output? question.response.output(): "";
        responses.push(response);
    }

    return responses;
  }

  validateParticipation(): [string, string, number] {
    for(let i = 0; i < this.survey.questions.length; i++) {
      let question = this.survey.questions[i];
      // There will be no method output() if the user has not visited the component.
      let response = question.response.output? question.response.output(): "";
      let elemId = "#response-error-" + question.viewId;

      //console.log(question.content.componentType + " = " + response);

      if(response.length == 0) {
        if(question.mandatory) {
            return [elemId, this.translateService.instant("must_answer_this_question"), i];
        }

        continue;
      }

      if(response.length > this.engineProps.responseMaxLength) {
        return [elemId, this.translateService.instant("very_long_response_reduce_text"), i];
      }

      let responseType = RESPONSE_TYPE[question.content.componentType];

      if(!this._checkResponseType(responseType, response)) {
        return [elemId, this.translateService.instant("invalid_response"), i];// This should not happen on the client
      }
      
      // Apply validators, there can be multiple values, each value must pass the validators.
      let values = this._parseResponse(responseType, response);

      for(let i = 0; i < values.length; i++) {
          let value = values[i];
          let valid = true;

          for(let j = 0; j < question.validators.length; j++) {
            let validator = question.validators[j];

             if(j == 0) {
                 valid = this._checkExpression(validator, value);
             } else if(question.validators[j - 1].operator == ValidationOperator.Or) {
                  valid = valid || this._checkExpression(validator, value);
              } else {// operator == None or And
                  valid = valid && this._checkExpression(validator, value);
              }
          }

          if(!valid) {
            return [elemId, question.content.errorMessage?? this.translateService.instant("invalid_response"), i];
          }
      }
    }

    return null;
  }

  validationError(elemId: string, errMsg: string, qIndex: number = undefined, scrollPos: ScrollPosition = 'center') {
    if(qIndex >= 0) {
      let nextPage = Math.ceil((qIndex+1) / this.paginatorData.rows) - 1;
      this.loadPage(nextPage, elemId, () => {
        insertValidationError(elemId, errMsg, scrollPos);
      });
    } else {
        insertValidationError(elemId, errMsg, scrollPos);
    }
  }

  private createQuestionItem(question: QuestionImpl) {
    let component = QUESTION_CLASS[question.content.componentType];
    return new DynamicItem(component, {
      content: question.content.componentData,
      state: {
          edited: false,
          disabled: this.disabledQuestions
      },
      mandatory: question.mandatory,
      response: question.response
    } as QuestionData);
  }

  private loadPage(nextPage: number = undefined, selector: string = undefined, callback: () => void = undefined) {
    this.pageQuestions = loadPageList(this.survey.questions, this.paginatorData, nextPage, selector, callback);
    this.questionItems = [];

    for(let question of this.pageQuestions) {
        this.questionItems.push(this.createQuestionItem(question));
    }
  }

  private _parseResponse(responseType: ResponseType, response: string) {
    let values = [];

    if(this._isArray(responseType)) {
        values = response.split(";");
    } else {
        values = [];
        values[0] = response;
    }

    return values;
  }

  private _isArray(responseType: ResponseType) {
    return responseType == ResponseType.ManyOptions || 
    responseType == ResponseType.Range || 
    responseType == ResponseType.DateRange || 
    responseType == ResponseType.ArrayBool || 
    responseType == ResponseType.ArrayText || 
    responseType == ResponseType.ArrayNumber || 
    responseType == ResponseType.ArrayDate;
  }

  private _checkResponseType(responseType: ResponseType, value: string) {
    if(responseType == ResponseType.Bool) {
        return value == "true" || value == "false";
    } else if(responseType == ResponseType.Text) {
        return true;
    } else if(responseType == ResponseType.Number) {
        return isDigit(value);
    } else if(responseType == ResponseType.Percent) {
        if(!isUDigit(value)) {
            return false;
        }

        let num = parseInt(value);
        return num > 0 && num <= 100;
    } else if(responseType == ResponseType.Date) {
        return isUDigit(value);
    } else if(responseType == ResponseType.Rating) {
        if(!isUDigit(value)) {
            return false;
        }

        let num = parseInt(value);
        return num > 0 && num <= 5;
    } else if(responseType == ResponseType.OneOption) {
        return isUDigit(value);
    } else if(responseType == ResponseType.ManyOptions) {
        let array = value.split(";");
        for(let i = 0; i < array.length; i++) {
            if(!isUDigit(array[i])) {
                return false;
            }
        }

        return true;
    } else if(responseType == ResponseType.Range) {
        let array = value.split(";");
        if(array.length != 2) {
            return false;
        }

        for(let i = 0; i < array.length; i++) {
            if(!isDigit(array[i])) {
                return false;
            }

            if(i == 1 && parseInt(array[i]) <= parseInt(array[i-1])) {
                return false;
            }
        }

        return true;
    } else if(responseType == ResponseType.DateRange) {
        let array = value.split(";");
        if(array.length != 2) {
            return false;
        }

        for(let i = 0; i < array.length; i++) {
            if(!isUDigit(array[i])) {
                return false;
            }

            if(i == 1 && parseInt(array[i]) <= parseInt(array[i-1])) {
                return false;
            }
        }

        return true;
    } else if(responseType == ResponseType.ArrayBool) {
        let array = value.split(";");
        for(let i = 0; i < array.length; i++) {
            if(!this._checkResponseType(ResponseType.Bool, array[i])) {
                return false;
            }
        }

        return true;
    } else if(responseType == ResponseType.ArrayText) {
        let array = value.split(";");
        for(let i = 0; i < array.length; i++) {
            if(!this._checkResponseType(ResponseType.Text, array[i])) {
                return false;
            }
        }

        return true;
    } else if(responseType == ResponseType.ArrayNumber) {
        let array = value.split(";");
        for(let i = 0; i < array.length; i++) {
            if(!this._checkResponseType(ResponseType.Number, array[i])) {
                return false;
            }
        }

        return true;
    } else if(responseType == ResponseType.ArrayDate) {
        let array = value.split(";");
        for(let i = 0; i < array.length; i++) {
            if(!this._checkResponseType(ResponseType.Date, array[i])) {
                return false;
            }
        }

        return true;
    }

    throw new Error("Unknown response type.");
  }

  private _checkExpression(validator: QuestionValidator, value: string) {
    if(validator.expression == ValidationExpression.Empty) {
        return value.length == 0;
    } else if(validator.expression == ValidationExpression.NotEmpty) {
        return value.length > 0;
    } else if(validator.expression == ValidationExpression.Equals) {
        return value == validator.value;
    } else if(validator.expression == ValidationExpression.NotEquals) {
        return value != validator.value;
    } else if(validator.expression == ValidationExpression.Contains) {
        return value.indexOf(validator.value) != -1;
    } else if(validator.expression == ValidationExpression.NotContains) {
        return value.indexOf(validator.value) == -1;
    } else if(validator.expression == ValidationExpression.EqualsIgnoreCase) {
        return value.toLowerCase() == validator.value.toLowerCase();
    } else if(validator.expression == ValidationExpression.NotEqualsIgnoreCase) {
        return value.toLowerCase() != validator.value.toLowerCase();
    } else if(validator.expression == ValidationExpression.ContainsIgnoreCase) {
        return value.toLowerCase().indexOf(validator.value.toLowerCase()) != -1;
    } else if(validator.expression == ValidationExpression.NotContainsIgnoreCase) {
        return value.toLowerCase().indexOf(validator.value.toLowerCase()) == -1;
    } else if(validator.expression == ValidationExpression.Greater) {
        return parseInt(value) > parseInt(validator.value);
    } else if(validator.expression == ValidationExpression.GreaterEquals) {
        return parseInt(value) >= parseInt(validator.value);
    } else if(validator.expression == ValidationExpression.Less) {
        return parseInt(value) < parseInt(validator.value);
    } else if(validator.expression == ValidationExpression.LessEquals) {
        return parseInt(value) <= parseInt(validator.value);
    } else if(validator.expression == ValidationExpression.ContainsDigits) {
        return containsDigits(value);
    } else if(validator.expression == ValidationExpression.NotContainsDigits) {
        return !containsDigits(value);
    } else if(validator.expression == ValidationExpression.MinLength) {
        return value.length >= parseInt(validator.value);
    } else if(validator.expression == ValidationExpression.MaxLength) {
        return value.length <= parseInt(validator.value);
    }

    throw new Error("Unknown expression.");
  }
}
