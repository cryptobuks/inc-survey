import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SurveyListComponent } from './pages/survey-list/survey-list.component';
import { CreateSurveyComponent } from './pages/create-survey/create-survey.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { TakeSurveyComponent } from './pages/take-survey/take-survey.component';
import { SurveyPreviewComponent } from './pages/survey-preview/survey-preview.component';
import { SurveyDetailsComponent } from './pages/survey-details/survey-details.component';
import { SurveySentComponent } from './pages/survey-sent/survey-sent.component';
import { PartSentComponent } from './pages/part-sent/part-sent.component';
import { SurveyAnswersComponent } from './pages/survey-answers/survey-answers.component';
import { OwnSurveysComponent } from './pages/own-surveys/own-surveys.component';
import { OwnPartsComponent } from './pages/own-parts/own-parts.component';
import { TokenSaleComponent } from './pages/token-sale/token-sale.component';
import { UniswapComponent } from './pages/uniswap/uniswap.component';

const routes: Routes = [
  { path: "", component: DashboardComponent },
  { path: "dashboard", component: DashboardComponent },
  { path: "dashboard/my-surveys", component: OwnSurveysComponent },
  { path: "dashboard/my-surveys/:address", component: SurveyDetailsComponent },
  { path: "dashboard/my-surveys/:address/answers", component: SurveyAnswersComponent },
  { path: "dashboard/my-parts", component: OwnPartsComponent },
  { path: "dashboard/my-parts/:address", component: SurveyDetailsComponent },
  { path: "dashboard/my-parts/:address/answers", component: SurveyAnswersComponent },

  { path: "surveys", component: SurveyListComponent },
  { path: "surveys/:address", component: SurveyDetailsComponent },
  { path: "surveys/:address/answers", component: SurveyAnswersComponent },
  { path: "take-survey", component: TakeSurveyComponent },
  { path: "take-survey/status", component: PartSentComponent },

  { path: "create-survey", component: CreateSurveyComponent },
  { path: "create-survey/preview", component: SurveyPreviewComponent },
  { path: "create-survey/status", component: SurveySentComponent },

  { path: "token-sale", component: TokenSaleComponent },
  { path: "swap", component: UniswapComponent },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
