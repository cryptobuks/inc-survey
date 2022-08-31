import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injector, NgModule } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GenericDialogComponent } from './comps/generic-dialog/generic-dialog.component';
import { GenericSnackBarComponent } from './comps/generic-snack-bar/generic-snack-bar.component';
import { PrimeNGModule } from './primeng.module';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { FormsModule } from '@angular/forms';
import { InputTokenComponent } from './comps/input-token/input-token.component';
import { ToggleSwitchComponent } from './comps/toggle-switch/toggle-switch.component';
import { Web3Service } from './services/web3.service';
import { SurveyListComponent } from './pages/survey-list/survey-list.component';
import { CreateSurveyComponent } from './pages/create-survey/create-survey.component';
import { SurveyPreviewComponent } from './pages/survey-preview/survey-preview.component';
import { TakeSurveyComponent } from './pages/take-survey/take-survey.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DynamicTemplateComponent } from './comps/dynamic-template/dynamic-template.component';
import { QuestionTextComponent } from './comps/question-text/question-text.component';
import { QuestionImplComponent } from './comps/question-impl/question-impl.component';
import { QuestionOptionsComponent } from './comps/question-options/question-options.component';
import { SurveyService } from './services/survey.service';
import { DatetimeModule } from './datetime.module';
import { BalanceChipComponent } from './comps/balance-chip/balance-chip.component';
import { UtilService } from './services/util.service';
import { SurveyImplComponent } from './comps/survey-impl/survey-impl.component';
import { QuestionChecksComponent } from './comps/question-checks/question-checks.component';
import { QuestionDropdownComponent } from './comps/question-dropdown/question-dropdown.component';
import { QuestionPercentComponent } from './comps/question-percent/question-percent.component';
import { QuestionDateComponent } from './comps/question-date/question-date.component';
import { QuestionRatingComponent } from './comps/question-rating/question-rating.component';
import { QuestionToggleComponent } from './comps/question-toggle/question-toggle.component';
import { QuestionRangeComponent } from './comps/question-range/question-range.component';
import { QuestionLinearScaleComponent } from './comps/question-linear-scale/question-linear-scale.component';
import { QuestionDateRangeComponent } from './comps/question-date-range/question-date-range.component';
import { SurveyDetailsComponent } from './pages/survey-details/survey-details.component';
import { StateService } from './services/state.service';
import { SurveySentComponent } from './pages/survey-sent/survey-sent.component';
import { IpfsService } from './services/ipfs.service';
import { DashCardComponent } from './comps/dash-card/dash-card.component';
import { RequestInterceptor } from './shared/request-interceptor';
import { ErrorInterceptor } from './shared/error-interceptor';
import { PartSentComponent } from './pages/part-sent/part-sent.component';
import { SurveyAnswersComponent } from './pages/survey-answers/survey-answers.component';
import { ResponseImplComponent } from './comps/response-impl/response-impl.component';
import { ResponseTextComponent } from './comps/response-text/response-text.component';
import { ResponseOptionsComponent } from './comps/response-options/response-options.component';
import { NumberArrayPipe } from './shared/number-array.pipe';
import { ResponseChecksComponent } from './comps/response-checks/response-checks.component';
import { ResponseLinearScaleComponent } from './comps/response-linear-scale/response-linear-scale.component';
import { ResponseRatingComponent } from './comps/response-rating/response-rating.component';
import { ResponsePercentComponent } from './comps/response-percent/response-percent.component';
import { ResponseDateRangeComponent } from './comps/response-date-range/response-date-range.component';
import { ResponseDateComponent } from './comps/response-date/response-date.component';
import { ResponseToggleComponent } from './comps/response-toggle/response-toggle.component';
import { ResponseRangeComponent } from './comps/response-range/response-range.component';
import { SurveyBannerComponent } from './comps/survey-banner/survey-banner.component';
import { BreadcrumbsComponent } from './comps/breadcrumbs/breadcrumbs.component';
import { IncTimelineComponent } from './comps/inc-timeline/inc-timeline.component';
import { OwnSurveysChartComponent } from './comps/own-surveys-chart/own-surveys-chart.component';
import { OwnSurveysComponent } from './pages/own-surveys/own-surveys.component';
import { SurveyListItemComponent } from './comps/survey-list-item/survey-list-item.component';
import { OwnPartsComponent } from './pages/own-parts/own-parts.component';
import { UniswapComponent } from './pages/uniswap/uniswap.component';
import { UniswapWidgetWrapper } from 'src/extensions/UniswapWidgetWrapper';
import { TxStatusComponent } from './comps/tx-status/tx-status.component';
import { TokenSaleComponent } from './pages/token-sale/token-sale.component';
import { FlipdownComponent } from './comps/flipdown/flipdown.component';

@NgModule({
  declarations: [
    AppComponent,
    GenericDialogComponent,
    GenericSnackBarComponent,
    NotFoundComponent,
    InputTokenComponent,
    ToggleSwitchComponent,
    SurveyListComponent,
    CreateSurveyComponent,
    SurveyPreviewComponent,
    TakeSurveyComponent,
    DashboardComponent,
    DynamicTemplateComponent,
    QuestionTextComponent,
    QuestionImplComponent,
    QuestionOptionsComponent,
    BalanceChipComponent,
    SurveyImplComponent,
    QuestionChecksComponent,
    QuestionDropdownComponent,
    QuestionPercentComponent,
    QuestionDateComponent,
    QuestionRatingComponent,
    QuestionToggleComponent,
    QuestionRangeComponent,
    QuestionLinearScaleComponent,
    QuestionDateRangeComponent,
    SurveyDetailsComponent,
    SurveySentComponent,
    DashCardComponent,
    PartSentComponent,
    SurveyAnswersComponent,
    ResponseImplComponent,
    ResponseTextComponent,
    ResponseOptionsComponent,
    NumberArrayPipe,
    ResponseChecksComponent,
    ResponseLinearScaleComponent,
    ResponseRatingComponent,
    ResponsePercentComponent,
    ResponseDateRangeComponent,
    ResponseDateComponent,
    ResponseToggleComponent,
    ResponseRangeComponent,
    SurveyBannerComponent,
    BreadcrumbsComponent,
    IncTimelineComponent,
    OwnSurveysChartComponent,
    OwnSurveysComponent,
    SurveyListItemComponent,
    OwnPartsComponent,
    UniswapComponent,
    UniswapWidgetWrapper,
    TxStatusComponent,
    TokenSaleComponent,
    FlipdownComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => {
          return new TranslateHttpLoader(http);
        },
        deps: [HttpClient]
      },
      // For Missing Translation
      //https://github.com/ngx-translate/core#how-to-handle-missing-translations
      useDefaultLang: true
    }),
    MaterialModule,
    BrowserAnimationsModule,
    PrimeNGModule,
    FormsModule,
    DatetimeModule
  ],
  entryComponents: [
    GenericDialogComponent
  ],
  providers: [
    StateService, UtilService, Web3Service, SurveyService, IpfsService,
    //{ provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true },
    //{ provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  /**
   * Allows for retrieving singletons using `AppModule.injector.get(MyService)`
   * This is good to prevent injecting the service as constructor parameter.
   */
  static injector: Injector;
  static dialog: MatDialog;
  static snackBar: MatSnackBar;

  constructor(private injector: Injector, private dialog: MatDialog, private snackBar: MatSnackBar) {
    AppModule.injector = injector;
    AppModule.dialog = dialog;
    AppModule.snackBar = snackBar;
  }
}
