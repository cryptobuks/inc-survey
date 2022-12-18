import { CdkDragDrop, CdkDragEnter, CdkDragExit, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, ViewChild } from '@angular/core';
import BigNumber from 'bignumber.js';
import { AppModule } from 'src/app/app.module';
import { QuestionImplComponent } from 'src/app/comps/question-impl/question-impl.component';
import { TokenSelectorComponent } from 'src/app/comps/token-selector/token-selector.component';
import { DynamicItem } from 'src/app/models/dynamic-item';
import { QuestionImpl } from 'src/app/models/question-impl';
import { SurveyEditState } from 'src/app/models/survey-edit-state';
import { SurveyImpl } from 'src/app/models/survey-impl';
import { ValidationOperator, ValidationExpression, ResponseType } from 'src/app/models/survey-model';
import { ComponentType, RESPONSE_TYPE } from 'src/app/models/survey-support';
import { newTokenFromInfo } from 'src/app/models/token-data';
import { CURRENT_CHAIN, HOUR_MILLIS } from 'src/app/shared/constants';
import { cloneDeep, isEmpty, isValidHttpUrl, lengthBase64, resizeBase64Image, truncateSeconds, isDigit, isUDigit, loadPageList, uniqueId, moveScrollTo, insertValidationError, toFixedBigNumber, isIpfsUri, formatDuration, toAmount, toUnits, calcGasReserve } from 'src/app/shared/helper';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { BasePageComponent } from '../base-page.component';
declare var $: any;
declare var uuidv4: any;

interface QuestionType {
  icon?: string;
  svgIcon?: string;
  label: string;
  componentType: ComponentType;
  componentData: any;
  validationDescKeys?: string[];
  preview?: DynamicItem;
}

@Component({
  selector: 'app-create-survey',
  templateUrl: './create-survey.component.html',
  styleUrls: ['./create-survey.component.css']
})
export class CreateSurveyComponent extends BasePageComponent {

  readonly titleKey = "create_survey";

  defaultOptions = [
    { value: 1, label: this.translateService.instant("option") + " 1" },
    { value: 2, label: this.translateService.instant("option") + " 2" },
    { value: 3, label: this.translateService.instant("option") + " 3" },
    { value: 4, label: this.translateService.instant("option") + " 4" }
  ];

  availableQuestions = [
    {
      icon: 'short_text',
      label: 'short_text_response',
      componentType: ComponentType.TEXT_SINGLE_LINE,
      componentData: {}
    },
    {
      icon: 'notes',
      label: 'multiline_text_response',
      componentType: ComponentType.TEXT_MULTI_LINE,
      componentData: {
        multiline: true 
      }
    },
    {
      icon: 'check_circle',
      label: 'select_an_option',
      componentType: ComponentType.OPTIONS,
      componentData: {
        options: cloneDeep(this.defaultOptions)
      }
    },
    {
      icon: 'check_box',
      label: 'select_multiple_options',
      componentType: ComponentType.CHECKBOXES,
      componentData: {
        options: cloneDeep(this.defaultOptions)
      }
    },
    {
      svgIcon: 'option_grid',
      label: 'single_choice_grid',
      componentType: ComponentType.OPTIONS,
      componentData: {
        options: cloneDeep(this.defaultOptions),
        useGrid: true
      }
    },
    {
      icon: 'apps',
      label: 'multiple_choice_grid',
      componentType: ComponentType.CHECKBOXES,
      componentData: {
        options: cloneDeep(this.defaultOptions),
        useGrid: true
      }
    },
    {
      icon: 'arrow_drop_down_circle',
      label: 'dropdown',
      componentType: ComponentType.DROPDOWN,
      componentData: {
        options: cloneDeep(this.defaultOptions)
      }
    },
    {
      icon: 'linear_scale',
      label: 'linear_scale',
      componentType: ComponentType.LINEAR_SCALE,
      componentData: {
        from: 1,
        to: 5
      }
    },
    {
      icon: 'percent',
      label: 'percent',
      componentType: ComponentType.PERCENT,
      componentData: {}
    },
    {
      icon: 'space_bar',
      label: 'range',
      componentType: ComponentType.RANGE,
      componentData: {
        min: 0,
        max: 100
      },
      validationDescKeys: ['note_are_validating_both_values', 'range_with_same_value_not_accepted']
    },
    {
      icon: 'event',
      label: 'date',
      componentType: ComponentType.DATE,
      componentData: {},
      validationDescKeys: ['value_represents_date_seconds']
    },
    {
      icon: 'date_range',
      label: 'date_range',
      componentType: ComponentType.DATE_RANGE,
      componentData: {},
      validationDescKeys: ['value_represents_date_seconds', 'note_are_validating_both_dates', 'start_date_always_less_end_date']
    },
    {
      icon: 'star_rate',
      label: 'rating',
      componentType: ComponentType.RATING,
      componentData: {}
    },
    {
      icon: 'toggle_on',
      label: 'toggle',
      componentType: ComponentType.TOGGLE,
      componentData: {}
    }
  ];

  state: SurveyEditState;
  survey: SurveyImpl;
  pageQuestions: QuestionImpl[] = [];
  currIndex: number;

  imageLoading = false;
  imageError = false;

  partPrice: BigNumber;
  keysNum: number;
  loading = false;

  get minStartDate(): Date {
    // Set a margin so that the time for the survey to be completed
    let currTime = truncateSeconds(new Date(this.web3Service.currenTime)).getTime();
    return new Date(currTime + HOUR_MILLIS);
  };
  get maxStartDate(): Date {
    let currTime = truncateSeconds(new Date(this.web3Service.currenTime)).getTime();
    return new Date(currTime + this.configProps.startMaxTime * 1000);
  };
  get minEndDate(): Date {
    // The selector does not admit seconds, so we add a minute that would be greater than the minimum.
    // This looks good on the view because the minimum is set to [x minutes - 1 second].
    return new Date(this.survey.startDate.getTime() + this.configProps.rangeMinTime * 1000 + 60000);
  };
  get maxEndDate(): Date {
    // We can add a minute to the selector since the maximum established is [x minutes - 1 second].
    return new Date(this.survey.startDate.getTime() + this.configProps.rangeMaxTime * 1000 + 60000);
  };

  get maxParts(): string {
    let budget = new BigNumber(this.state.budgetAmount);// is amount
    let reward = new BigNumber(this.state.rewardAmount);// is amount

    if(budget.isNaN() || !budget.isGreaterThan(0) || reward.isNaN() || !reward.isGreaterThan(0) || budget.isLessThan(reward)) {
      this.keysNum = 0;
      return "-";
    }

    if(!budget.modulo(reward).isEqualTo(0)) {
      this.keysNum = 0;
      return "N/A";
    }

    let result = budget.dividedBy(reward);

    this.keysNum = result.toNumber();
    
    return result.toFixed(0);
  }

  get duration(): string {
    if(!this.survey.startDate || !this.survey.endDate) {
      return "-";
    }

    if(this.survey.endDate.getTime() - 1000 < this.survey.startDate.getTime()) {
      return "N/A";
    }

    let time = this.survey.endDate.getTime() - this.survey.startDate.getTime() - 1000;
    return formatDuration(time);
  }

  get newGasReserve(): BigNumber {
    let budget = toUnits(this.state.budgetAmount, this.survey.tokenData.decimals);
    let reward = toUnits(this.state.rewardAmount, this.survey.tokenData.decimals);
    return calcGasReserve(budget, reward, this.partPrice, 50);
  }

  get isLowGasReserve(): boolean {
    let gasReserve = toUnits(this.state.gasReserveAmount);
    return gasReserve.isLessThan(this.newGasReserve);
  }

  get keysMax(): number {
    return this.configProps.hashMaxPerSurvey;
  }

  get keysMaxFormatted(): string {
    return new BigNumber(this.keysMax).toFormat();
  }

  @ViewChild('destCnt')
  destCnt: ElementRef;

  private onChainLoadedRemover: ListenerRemover;

  constructor(
    element: ElementRef
  ) {
    super(element);

    this.state = this.stateService.surveyEditState;

    if(!this.state) {
      this.state = this.stateService.createSurveyEditState();
      this.survey = this.state.survey;

      let question = this.createQuestion(this.availableQuestions[2]);
      this.survey.questions.push(question);

      this.state.budgetAmount = toFixedBigNumber(toAmount(this.survey.budget, this.survey.tokenData.decimals));
      this.state.rewardAmount = toFixedBigNumber(toAmount(this.survey.reward, this.survey.tokenData.decimals));
      this.state.gasReserveAmount = '0';
    } else {
      this.survey = this.state.survey;
    }
  }

  onInit() {
    if(!this.survey.title) {
      this.survey.title = this.translateService.instant('untitled_survey');
    }

    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadChainData();
    }, () => {
      return this.loadedChainData;
    });
    
    this.loadImageData();
    this.loadPage();
  }

  onViewLoaded() {
  }

  onDestroy() {
    this.onChainLoadedRemover && this.onChainLoadedRemover();
  }

  onImageError(event: Event) {
    this.imageError = true;
  }

  onChangeLogoUrl(url: string) {
    this.survey.imageData = undefined;

    if(isIpfsUri(url) || isValidHttpUrl(url)) {
      this.imageError = false;
      this.loadImageData();
    } else {
      this.imageError = true;
    }
  }

  onSelectImage(event: any) { // called each time file input changes
    if(this.imageLoading) {
      return;
    }
    
    this.survey.imageData = undefined;
    this.survey.logoUrl = undefined;
    this.imageError = false;

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.imageLoading = true;

      const reader = new FileReader();
      reader.readAsDataURL(file); // read file as data url

      reader.onload = (event) => { // called once readAsDataURL is completed
        let image = event.target?.result as string;
        let sizeMB = file.size / 1024 / 1024;

        if (sizeMB > 1) {
          // resize to 1MB
          let maxSize = 512; // https://jan.ucc.nau.edu/lrm22/pixels2bytes/calculator.htm
          resizeBase64Image(image, maxSize, maxSize).then((result) => {
            sizeMB = lengthBase64(result) / 1024 / 1024;

            if (sizeMB > 1) {
              insertValidationError(".survey-logo", this.translateService.instant("logo_size_exceeds_limit"));
            } else {
              this.survey.imageData = result;
            }
            
            this.imageLoading = false;
          }, (e) => {
            insertValidationError(".survey-logo", this.translateService.instant("invalid_file"));
            this.imageLoading = false;
          });
        } else {
          this.survey.imageData = image;
          this.imageLoading = false;
        }
      };

      reader.onerror = (event) => { 
        insertValidationError(".survey-logo", this.translateService.instant("invalid_file"));
        this.imageLoading = false;
      };
    }
  }

  openTokenSelector(): void {
    const data = {
      chainId: this.accountData.chainId ?? CURRENT_CHAIN,
      address: this.survey.tokenData.address,
      symbol: this.survey.tokenData.symbol
    };
    const dialogRef = AppModule.dialog.open(TokenSelectorComponent, {
      data: data
    });

    dialogRef.afterClosed().subscribe(tokenInfo => {
      if (tokenInfo) {
        this.survey.tokenData = newTokenFromInfo(tokenInfo);
        this.survey.tokenData.balance = tokenInfo.balance;
        this.survey.tokenData.hfBalance = tokenInfo.hfBalance;
      }
    });
  }

  onChangeBudget() {
    this.loadGasReserve();
  }

  onChangeReward() {
    this.loadGasReserve();
  }

  onChangeGasReserve() {
  }

  loadGasReserve() {
    this.state.gasReserveAmount = toFixedBigNumber(toAmount(this.newGasReserve));
  }

  setPartKeys(num: number) {
    if(num > this.keysMax) {
      this.keysNum = num = this.keysMax;
    }

    this.survey.partKeys = [];

    for(let i = 0; i < num; i++) {
      this.survey.partKeys[i] = uuidv4();
    }
  }

  createQuestion(questionType: QuestionType) {
    let newQuestion: QuestionImpl = {
      content: {
        title: this.translateService.instant("question") + ' ' + (this.survey.questions.length + 1),
        componentType: questionType.componentType,
        componentData: cloneDeep(questionType.componentData)
      },
      viewId: uniqueId(),
      mandatory: true,
      validators: [],
      validationDescKeys: questionType.validationDescKeys,
      response: {}
    };

    return newQuestion;
  }

  createQuestionPreview(questionType: QuestionType) {
    let preview = questionType.preview;

    if (!preview) {
      let question = this.createQuestion(questionType);
      preview = questionType.preview = new DynamicItem(QuestionImplComponent, {
        question: question,
        width: $(this.destCnt.nativeElement).width() - 20
      });
    }

    return preview;
  }

  onSourceListExited(event: CdkDragExit<any>) {
    this.currIndex = event.container._dropListRef.getItemIndex(event.item._dragRef);
    this.availableQuestions.splice(this.currIndex, 0, this.availableQuestions[this.currIndex]);
  }

  onSourceListEntered(event: CdkDragEnter<any>) {
    this.availableQuestions.splice(this.currIndex, 1);
  }

  noReturnPredicate() {
    return false;
  }

  onDestDropped(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      let questionType = event.previousContainer.data[event.previousIndex];
      let newQuestion = this.createQuestion(questionType);

      event.previousContainer.data.splice(event.previousIndex, 1);
      event.container.data.splice(event.currentIndex, 0, newQuestion);

      let start = this.state.paginatorData.first;
      this.survey.questions.splice(start + event.currentIndex, 0, newQuestion);

      let nextPage = Math.ceil((start + event.currentIndex + 1) / this.state.paginatorData.rows) - 1;
      this.loadPageToScroll(nextPage, newQuestion.viewId);
    }
  }

  canAddQuestion() {
    return this.survey.questions.length < this.configProps.questionMaxPerSurvey;
  }

  addQuestion(questionType: QuestionType) {
    let newQuestion = this.createQuestion(questionType);
    this.survey.questions.splice(this.survey.questions.length, 0, newQuestion);

    let nextPage = Math.ceil(this.survey.questions.length / this.state.paginatorData.rows) - 1;
    this.loadPageToScroll(nextPage, newQuestion.viewId);
  }

  duplicateQuestion(viewId: string) {
    let index = this.survey.questions.findIndex(q => q.viewId == viewId);
    let newQuestion = cloneDeep(this.survey.questions[index]);
    newQuestion.viewId = uniqueId();
    this.survey.questions.splice(index+1, 0, newQuestion);

    let nextPage = Math.ceil((index+2) / this.state.paginatorData.rows) - 1;
    this.loadPageToScroll(nextPage, newQuestion.viewId);
  }

  removeQuestion(viewId: string) {
    //this.survey.questions.splice(index, 1);
    let index = this.survey.questions.findIndex(q => q.viewId == viewId);
    $(`#${viewId} button`).each(function(i: number, elem: any) {
      this.disabled = true;
    });

    let comp = this;
    /*$(`#${viewId}`).fadeOut(500, function() {
      comp.survey.questions.splice(index, 1);
      comp.loadPage();
    });*/

    $(`#${viewId}`).animate({ height: 0, opacity: 0 }, 500, function() {
      // Animation complete.
      comp.survey.questions.splice(index, 1);
      comp.loadPage();
    });
  }

  onPageChange(event: any) {
    this.state.paginatorData = event;
    let comp = this;

    $('.dest-list').fadeTo(100, 0.01, function() {
        comp.loadPage();
        $(this).fadeTo(1000, 1);
    });
  }

  async loadSurveyPreview() {
    this.loading = true;
    
    try {
      await this.web3Service.loadTokenBalance(this.survey.tokenData);
    } catch (err: any) {
      console.error("Failed to get balance for " + this.survey.tokenData.symbol);
    }

    const validation = this.validateSurvey();

    if(validation) {
      let elemId = validation[0];
      let errMsg = validation[1];
      let qIndex = validation[2];

      this.validationError(elemId, errMsg, qIndex);
      this.loading = false;
      return;
    }

    let gasReserve = toUnits(this.state.gasReserveAmount);
    let budget = toUnits(this.state.budgetAmount, this.survey.tokenData.decimals);
    let reward = toUnits(this.state.rewardAmount, this.survey.tokenData.decimals);
    /*let totalFee = calcFeeTotal(budget, reward, this.configProps.feeWei);
    let weiAmount = gasReserve.plus(totalFee);

    if(weiAmount.isGreaterThan(this.accountData.ccyBalance)) {
      this.showError(this.translateService.instant("insufficient_x_balance", { val1: this.currSymbol }));
      this.loading = false;
      return;
    }*/

    this.survey.budget = budget;
    this.survey.reward = reward;
    this.survey.gasReserve = gasReserve;

    this.state.validated = true;
    this.router.navigate(['/create-survey/preview']);

    this.loading = false;
  }

  private async loadChainData() {
    await this.loadPartPrice();
    // in a multi-chain future, if the chainId changes, the token must be cleaned up.
    if(this.survey.tokenData.chainId != CURRENT_CHAIN) {
      this.survey.tokenData = {};
    }
  }

  private async loadPartPrice() {
    await this.surveyService.loadAvgTxGas();
    this.partPrice = await this.surveyService.calcPartPrice();
    this.loadGasReserve();
  }

  private async loadImageData() {
    if(!this.survey.imageData && this.survey.logoUrl) {
      this.survey.logoUrl = encodeURI(this.survey.logoUrl);
      this.survey.imageData = this.survey.logoUrl;
    }
  }

  private loadPage(nextPage: number = undefined, selector: string = undefined, callback: () => void = undefined) {
    this.pageQuestions = loadPageList(this.survey.questions, this.state.paginatorData, nextPage, selector, callback);
  }

  private loadPageToScroll(nextPage: number, viewId: string) {
    this.loadPage(nextPage, `#${viewId}`, () => {
      moveScrollTo(`#${viewId}`, 'top', -10);
    });
  }

  private validationError(elemId: string, errMsg: string, qIndex: number = undefined) {
    if(qIndex >= 0) {
      let nextPage = Math.ceil((qIndex+1) / this.state.paginatorData.rows) - 1;
      this.loadPage(nextPage, elemId, () => {
        insertValidationError(elemId, errMsg);
      });
    } else {
      insertValidationError(elemId, errMsg);
    }
  }

  private validateSurvey(): [string, string, number?] {

    this.survey.title = this.survey.title.trim();
    this.survey.description = this.survey.description?.trim();

     // logo is optional
    if((this.survey.logoUrl || this.survey.imageData) && this.imageError) {
      return [".survey-logo", this.translateService.instant("invalid_image")];
    }

    if(this.survey.logoUrl && this.survey.logoUrl.length > this.configProps.urlMaxLength) {
      return [".survey-logo", this.translateService.instant("url_too_long_max_x_chars", { val1: this.configProps.urlMaxLength })];
    }

    if(!this.survey.tokenData?.address) {
      return [".survey-token", this.translateService.instant("please_select_token")];
    }

    if(isEmpty(this.survey.tokenData.symbol) || isEmpty(this.survey.tokenData.name) ||
    this.survey.tokenData.symbol.length > this.configProps.tknSymbolMaxLength || 
    this.survey.tokenData.name.length > this.configProps.tknNameMaxLength) {
      return [".survey-token", this.translateService.instant("invalid_token")];
    }

    if(isEmpty(this.survey.title)) {
      return [".survey-title", this.translateService.instant("please_enter_title")];
    }

    if(this.survey.title.length > this.configProps.titleMaxLength) {
      return [".survey-title", this.translateService.instant("invalid_title_max_x_chars", { val1: this.configProps.titleMaxLength })];
    }

    // description is optional
    if(this.survey.description && this.survey.description.length > this.configProps.descriptionMaxLength) {
      return [".survey-description", this.translateService.instant("invalid_description_max_x_chars", { val1: this.configProps.descriptionMaxLength })];
    }

    let currTime = truncateSeconds(new Date(this.web3Service.currenTime)).getTime();

    if(!this.survey.startDate) {
      return [".survey-start-date", this.translateService.instant("please_enter_start_date")];
    }

    if(this.survey.startDate.getTime() < currTime + HOUR_MILLIS) {
      return [".survey-start-date", this.translateService.instant("invalid_start_date_min_1_hour")];
    }

    if(this.survey.startDate.getTime() - currTime > this.configProps.startMaxTime * 1000) {
      let days = Math.round(this.configProps.startMaxTime / 60 / 60 / 24);
      return [".survey-start-date", this.translateService.instant("invalid_start_date_max_x_days", { val1: days })];
    }

    if(!this.survey.endDate) {
      return [".survey-end-date", this.translateService.instant("please_enter_end_date")];
    }

    let range = this.survey.endDate.getTime() - this.survey.startDate.getTime() - 1000;

    if(range < this.configProps.rangeMinTime * 1000) {
      let duration = formatDuration(this.configProps.rangeMinTime * 1000);
      return [".survey-end-date", this.translateService.instant("invalid_date_range_min_x", { val1: duration })];
    }

    if(range > this.configProps.rangeMaxTime * 1000) {
      let duration = formatDuration(this.configProps.rangeMaxTime * 1000);
      return [".survey-end-date", this.translateService.instant("invalid_date_range_max_x", { val1: duration })];
    }

    let budget = toUnits(this.state.budgetAmount, this.survey.tokenData.decimals);

    if(budget.isNaN() || !budget.isGreaterThan(0)) {
      return [".survey-budget", this.translateService.instant("please_enter_valid_budget")];
    }

    if(budget.isGreaterThan(this.survey.tokenData.balance)) {
      return [".survey-budget", this.translateService.instant("budget_exceeds_your_x_balance", { val1: this.survey.tokenData.symbol })];
    }

    let reward = toUnits(this.state.rewardAmount, this.survey.tokenData.decimals);

    if(reward.isNaN() || !reward.isGreaterThan(0)) {
      return [".survey-reward", this.translateService.instant("please_enter_valid_reward")];
    }

    if(reward.isGreaterThan(budget)) {
      return [".survey-reward", this.translateService.instant("reward_exceeds_budget")];
    }

    if(!budget.modulo(reward).isEqualTo(0)) {
      return [".survey-budget", this.translateService.instant("wrong_number_participations")];
    }

    let partsNum = budget.dividedBy(reward).toNumber();

    if(this.survey.partKeys && this.survey.partKeys.length > 0 && this.survey.partKeys.length != partsNum) {
      return [".survey-keys-error", this.translateService.instant("wrong_number_coupons")];
    }

    let gasReserve = toUnits(this.state.gasReserveAmount);

    if(gasReserve.isNaN() || gasReserve.isLessThan(0)) {
      return [".survey-gas-reserve", this.translateService.instant("please_enter_valid_gas_reserve")];
    }

    if(gasReserve.isGreaterThan(this.accountData.ccyBalance)) {
      return [".survey-gas-reserve", this.translateService.instant("gas_reserve_exceeds_your_x_balance", { val1: this.currSymbol })];
    }

    if(this.survey.questions.length == 0) {
      return [".dest-cnt-error", this.translateService.instant("please_enter_questions")];
    }

    if(this.survey.questions.length > this.configProps.questionMaxPerSurvey) {
      return [".dest-cnt-error", this.translateService.instant("number_questions_exceeds_limit_x", { val1: this.configProps.questionMaxPerSurvey })];
    }

    for(let i = 0; i < this.survey.questions.length; i++) {
      let question = this.survey.questions[i];
      let elemId = "#question-error-" + question.viewId;

      question.content.title = question.content.title.trim();
      question.content.description = question.content.description?.trim();
      question.content.errorMessage = question.content.errorMessage?.trim();

      if(isEmpty(question.content.title)) {
        return [elemId, this.translateService.instant("please_ask_the_question"), i];
      }

      let json = JSON.stringify(question.content);
      //console.log("question.content: " + json);

      if(json.length > this.configProps.questionMaxLength) {
        return [elemId, this.translateService.instant("very_long_question_reduce"), i];
      }

      if(question.validators.length > this.configProps.validatorMaxPerQuestion) {
        return [elemId, this.translateService.instant("number_validators_exceeds_limit_x", { val1: this.configProps.validatorMaxPerQuestion }), i];
      }

      let responseType = RESPONSE_TYPE[question.content.componentType];

      for(let j = 0; j < question.validators.length; j++) {
        let validator = question.validators[j];
        //validator.value = validator.value.trim();

        if(validator.expression == ValidationExpression.None) {
          return [elemId, this.translateService.instant("validator_error_select_expression"), i];
        }

        if(j < (question.validators.length - 1) && validator.operator == ValidationOperator.None) {
          return [elemId, this.translateService.instant("validator_error_select_operator"), i];
        }

        if(validator.expression != ValidationExpression.Empty && validator.expression != ValidationExpression.NotEmpty && 
          validator.expression != ValidationExpression.ContainsDigits && validator.expression != ValidationExpression.NotContainsDigits) {
            if(isEmpty(validator.value)) {
              return [elemId, this.translateService.instant("validator_error_indicates_value"), i];
            }

            if(validator.value != validator.value.trim()) {
              return [elemId, this.translateService.instant("validator_must_not_spaces"), i];
            }

            if(validator.value.length > this.configProps.validatorValueMaxLength) {
              return [elemId, this.translateService.instant("invalid_validator_value_max_x_chars", { val1: this.configProps.validatorValueMaxLength }), i];
            }

            if(validator.expression == ValidationExpression.Greater || validator.expression == ValidationExpression.GreaterEquals || 
              validator.expression == ValidationExpression.Less || validator.expression == ValidationExpression.LessEquals || 
              responseType == ResponseType.Number || responseType == ResponseType.ArrayNumber || 
              responseType == ResponseType.Range) {
                if(!isDigit(validator.value)) {
                  return [elemId, this.translateService.instant("validator_value_must_be_integer"), i];
                }

                // Fix validator value: 0001 = 1
                validator.value = parseInt(validator.value).toString();
            }
            
            if(validator.expression == ValidationExpression.MinLength || validator.expression == ValidationExpression.MaxLength || 
              responseType == ResponseType.Percent || responseType == ResponseType.Rating || 
              responseType == ResponseType.Date || responseType == ResponseType.ArrayDate || 
              responseType == ResponseType.DateRange) {
                if(!isUDigit(validator.value)) {
                  return [elemId, this.translateService.instant("validator_value_must_be_positive_integer"), i];
                }

                // Fix validator value: 0001 = 1
                validator.value = parseInt(validator.value).toString();
            }

            if (validator.expression == ValidationExpression.MinLength || validator.expression == ValidationExpression.MaxLength) {
              if(parseInt(validator.value) > this.configProps.responseMaxLength) {
                return [elemId, this.translateService.instant("validator_value_exceeds_response_limit"), i];
              }
            }
  
            if (responseType == ResponseType.Bool || responseType == ResponseType.ArrayBool) {
              if(validator.value != "true" && validator.value != "false") {
                return [elemId, this.translateService.instant("validator_value_must_be_boolean"), i];
              }
            }
        } else if(validator.value) {
          throw new Error("The validator does not require any value");
        }
      }

      if(question.content.componentData.options) {
        let labels = {};

        for(let option of question.content.componentData.options) {
          if (labels[option.label]) {
            // we have already found this same id
            return [elemId, this.translateService.instant("duplicate_options_not_allowed"), i];
          } else {
            labels[option.label] = true;
          }
        }
      }
    }

    return null;
  }
}
