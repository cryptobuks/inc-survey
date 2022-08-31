import { Component, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';
import { AppModule } from '../app.module';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from '../app.component';
import { Lang } from '../models/lang';
import { Web3Service } from '../services/web3.service';
import { AccountData } from '../models/account-data';
import { Router } from '@angular/router';
import { IncProps, OfferProps } from '../models/inc-model';
import { SurveyService } from '../services/survey.service';
import { UtilService } from '../services/util.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EngineProps, SurveyProps } from '../models/survey-model';
import { StateService } from '../services/state.service';
import { CURRENT_CHAIN, NATIVE_CURRENCY, WRAPPED_CURRENCY } from '../shared/constants';
import { IpfsService } from '../services/ipfs.service';
import { isEmpty } from '../shared/helper';
declare var components: any;
declare var $: any;

const blockchainErrorRegex = /"message": "(?:execution reverted: )?([^"]+)"/g;
const serverErrorRegex = /Relayer:\s*(.+)/g;

// Ciclo de vida de los componentes: https://angular.io/guide/lifecycle-hooks
@Component({
  template: 'NO UI TO BE FOUND HERE!'
})
export abstract class BasePageComponent implements OnInit, OnDestroy {

  protected titleKey: string = "app_name";

  protected router: Router;
  protected ngZone: NgZone;
  protected translateService: TranslateService;
  protected stateService: StateService;
  protected utilService: UtilService;
  protected web3Service: Web3Service;
  protected surveyService: SurveyService;
  protected ipfsService: IpfsService;
  protected messageService: MessageService;
  protected confirmationService: ConfirmationService;
  protected navState: any;

  get hasConnection(): boolean { return this.web3Service.hasConnection; }
  get loadedChainData(): boolean { return this.web3Service.loadedChainData; }

  get currSymbol(): string { return NATIVE_CURRENCY[CURRENT_CHAIN].symbol; }
  get wrapSymbol(): string { return WRAPPED_CURRENCY[CURRENT_CHAIN].symbol; }
  get web3(): any { return this.web3Service.web3; };

  get incContract(): any { return this.web3Service.incContract; };
  get offerContract(): any { return this.web3Service.offerContract; };
  get surveyContract(): any { return this.web3Service.surveyContract; };
  get validatorContract(): any { return this.web3Service.validatorContract; };
  get engineContract(): any { return this.web3Service.engineContract; };
  get forwarderContract(): any { return this.web3Service.forwarderContract; };

  get accountData(): AccountData { return this.web3Service.accountData; };
  get incProps(): IncProps { return this.web3Service.incProps; };
  get offerProps(): OfferProps { return this.web3Service.offerProps; };
  get surveyProps(): SurveyProps { return this.surveyService.surveyProps; };
  get engineProps(): EngineProps { return this.surveyService.engineProps; };

  get lang(): Lang { return AppComponent.instance.selectedLang; };

  constructor(protected element: ElementRef) {
    this.router = AppModule.injector.get(Router);
    this.ngZone = AppModule.injector.get(NgZone);
    this.translateService = AppModule.injector.get(TranslateService);
    this.stateService = AppModule.injector.get(StateService);
    this.utilService = AppModule.injector.get(UtilService);
    this.web3Service = AppModule.injector.get(Web3Service);
    this.surveyService = AppModule.injector.get(SurveyService);
    this.ipfsService = AppModule.injector.get(IpfsService);
    this.messageService = AppModule.injector.get(MessageService);
    this.confirmationService = AppModule.injector.get(ConfirmationService);

    // It has to be done in constructor, in onInit () it is too late (navigation has finished).
    let navigation = this.router.getCurrentNavigation();
    this.navState = navigation?.extras.state;
  }

  ngOnInit() {
    components[this.constructor.name] = this;

    $(this.element.nativeElement).css({ 'display':'block', 'opacity':'0' });
    $(this.element.nativeElement).fadeTo(1000, 1);

    this.setTitle(this.translateService.instant(this.titleKey));
    this.onInit();
  }

  ngAfterViewInit() {
    this.onViewLoaded();

    if (this.constructor.name == "TakeSurveyComponent") {
      $('.grecaptcha-badge').css({ opacity: 1 }).show();
    } else {
      $('.grecaptcha-badge').hide();
    }
  }

  ngOnDestroy() {
    components[this.constructor.name] = null;
    this.onDestroy();
  }

  abstract onInit(): void;
  abstract onViewLoaded(): void;
  abstract onDestroy(): void;

  setTitle(title: string): void {
    AppComponent.instance.setTitle(title);
  }

  showTxError(error: any) {
    if (error.code === 4001) {
      // User rejected request
      return;
    }

    if (error.status === 0 || error.status === 503) {
      // The server does not respond
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant("error"),
        detail: this.translateService.instant("server_in_maintenance"),
        //life: 30000
      });
      return;
    }
    
    //console.error(error);
    let message: string;
    let details = error.message || error.error?.message;

    if(details) {
      let match = blockchainErrorRegex.exec(details);

      if(!match || !match[1]) {
        match = serverErrorRegex.exec(details);
      }

      if(match && match[1]) {
        details = match[1];
      }
    }

    if(!isEmpty(details)) {
      message = this.translateService.instant("transaction_has_failed") + ':\n' + details;
    } else {
      message = this.translateService.instant("transaction_failed_try_again_later");
    }

    this.messageService.add({
      severity: 'error',
      summary: this.translateService.instant("error"),
      detail: message,
      //life: 30000
    });
  }
}
