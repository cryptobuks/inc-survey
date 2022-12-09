import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { TranslateService } from '@ngx-translate/core';
import { DynamicItem } from 'src/app/models/dynamic-item';
import { MenuOption } from 'src/app/models/menu-option';
import { QuestionImpl } from 'src/app/models/question-impl';
import { ValidationExpression, ValidationOperator, ConfigProps } from 'src/app/models/survey-model';
import { QUESTION_CLASS, getExpressionTitle, getValidationExpressions, getValueType, QuestionData, RESPONSE_TYPE, ValidationValueType, getOperatorTitle } from 'src/app/models/survey-support';
import { SurveyService } from 'src/app/services/survey.service';
import { isEmpty } from 'src/app/shared/helper';
import { DynamicComponent } from '../dynamic-template/dynamic-template.component';
import { BaseQuestionComponent } from '../base-question.component';
declare var $: any;

@Component({
  selector: 'question-impl',
  templateUrl: './question-impl.component.html',
  styleUrls: ['./question-impl.component.css']
})
export class QuestionImplComponent implements OnInit, OnDestroy, DynamicComponent {

  @Input()
  question: QuestionImpl;

  @Input()
  editableLabels: boolean = false;

  @Input()
  canAddQuestion: boolean;

  @Output()
  onDuplicateQuestion = new EventEmitter<string>();

  @Output()
  onRemoveQuestion = new EventEmitter<string>();

  @ViewChild('box')
  box: ElementRef;

  data: any;//  preview data

  get configProps(): ConfigProps { return this.surveyService.configProps; };

  dynamicItem: DynamicItem;
  validationExpressions: any[] = [];
  validationOperators: any[] = [];
  useDescription = false;
  useErrorMessage = false;
  extraMenuOptions: MenuOption[];

  constructor(
    private element: ElementRef,
    private translateService: TranslateService,
    private surveyService: SurveyService
    ) {}

  ngOnInit(): void {
    if(this.data) {//  preview data
      this.question = this.data.question;
      /*this.editableLabels = this.data.editableLabels;
      this.onRemoveQuestion = this.data.onRemoveQuestion;
      ...*/
    }

    let component = QUESTION_CLASS[this.question.content.componentType];
    let responseType = RESPONSE_TYPE[this.question.content.componentType];
    let expressions = getValidationExpressions(responseType);

    this.dynamicItem = new DynamicItem(component, {
      content: this.question.content.componentData, 
      state: {
        edited: true,
        disabled: true
      },
      mandatory: this.question.mandatory,
      // New answer to not store results in edit view
      response: {},
    } as QuestionData);

    for(let expression of expressions) {
      this.validationExpressions.push({
        title: this.translateService.instant(getExpressionTitle(expression)),
        value: expression
      });
    }

    this.validationOperators = [
      {
        title: this.translateService.instant(getOperatorTitle(ValidationOperator.And)),
        value: ValidationOperator.And
      },
      {
        title: this.translateService.instant(getOperatorTitle(ValidationOperator.Or)),
        value: ValidationOperator.Or
      }
    ];

    this.useDescription = !isEmpty(this.question.content.description);
    this.useErrorMessage = !isEmpty(this.question.content.errorMessage);
  }

  ngAfterViewInit() {
    if(this.data?.width) {//  preview width
      $(this.box.nativeElement).width(this.data.width);
    }

    setTimeout(() => {
      this.extraMenuOptions = (this.dynamicItem.instance as BaseQuestionComponent)?.menuOptions;
    });
  }

  ngOnDestroy() {
  }

  onMandatoryChanged(change: MatSlideToggleChange) {
    this.dynamicItem.data.mandatory = change.checked;
  }

  switchDescriptionUse() {
    this.useDescription = !this.useDescription;
    if(!this.useDescription) {
      this.question.content.description = undefined;
    }
  }

  switchErrorMessageUse() {
    this.useErrorMessage = !this.useErrorMessage;
    if(!this.useErrorMessage) {
      this.question.content.errorMessage = undefined;
    }
  }

  isValidable() {
    return this.validationExpressions.length > 0;
  }

  hasValidation() {
    return this.question.validators.length > 0;
  }

  addValidator() {
    // questionIndex se asigna a la hora de enviar la encuesta
    this.question.validators.push({
      operator: ValidationOperator.None,
      expression: ValidationExpression.None,
      value: ''
    });
  }

  remValidator(index: number) {
    this.question.validators.splice(index, 1);

    if(!this.hasValidation()) {
      this.useErrorMessage = false;
      this.question.content.errorMessage = undefined;
    }
  }

  remValidation() {
    this.question.validators = [];
    this.useErrorMessage = false;
    this.question.content.errorMessage = undefined;
  }

  switchValidation() {
    if(!this.hasValidation()) {
      this.addValidator();
      this.useErrorMessage = true;
    } else {
      this.remValidation();
    }
  }

  hasValue(expression: ValidationExpression) {
    return getValueType(expression) != ValidationValueType.None;
  }

  duplicateQuestion() {
    if(this.onDuplicateQuestion)
    this.onDuplicateQuestion.emit(this.question.viewId);
  }

  removeQuestion() {
    if(this.onRemoveQuestion)
    this.onRemoveQuestion.emit(this.question.viewId);
  }
}
