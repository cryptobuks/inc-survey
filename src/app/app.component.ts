import { ApplicationRef, Component, HostListener, Inject, LOCALE_ID, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Lang } from './models/lang';
import { getUserLocale, moveScrollToTop, shortAddress, toAmount, toFormatBigNumber } from './shared/helper';
import { langMap, CURRENT_CHAIN, NET_PARAMS, INC_TOKEN, chartThemeDark, chartThemeLight, Theme, isTheme, NATIVE_CURRENCY, WRAPPED_CURRENCY } from './shared/constants';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { MatIconRegistry } from '@angular/material/icon';
import { Web3Service } from './services/web3.service';
import { OverlayPanel } from 'primeng/overlaypanel';
import { AccountData } from './models/account-data';
import { ListenerRemover, SimpleListener } from './shared/simple-listener';
import { Web3Error } from './shared/web3-error';
import { Breadcrumb, getBreadcrumbs } from './shared/menu';
import { TokenData } from './models/token-data';
import { NetData } from './models/net-data';
declare var $: any;
declare var charts: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  static instance: AppComponent;
  onThemeChanged = new SimpleListener();

  get hasConnection(): boolean { return this.web3Service.hasConnection; }
  get loadedChainData(): boolean { return this.web3Service.loadedChainData; }
  get net(): NetData { return NET_PARAMS[CURRENT_CHAIN]; }
  get ccy(): TokenData { return NATIVE_CURRENCY[CURRENT_CHAIN]; }
  get wCcy(): TokenData { return WRAPPED_CURRENCY[CURRENT_CHAIN]; }
  get web3(): any { return this.web3Service.web3; }
  get incContract(): any { return this.web3Service.incContract; }
  get accountData(): AccountData { return this.web3Service.accountData; }
  get accountShortAddress(): string | null {
    return shortAddress(this.accountData?.address);
  }
  get humanFriendlyIncBalance() {
    return this.accountData?.incBalance? toFormatBigNumber(toAmount(this.accountData.incBalance)): '-';
  }
  get humanFriendlyCcyBalance() {
    return this.accountData?.ccyBalance? toFormatBigNumber(toAmount(this.accountData.ccyBalance)): '-';
  }
  /*get humanFriendlyWCcyBalance() {
    return this.accountData?.wCcyBalance? toFormatBigNumber(toAmount(this.accountData.wCcyBalance)): '-';
  }*/

  options: any[] = [];
  langs: Lang[] = [];
  breadcrumbs: Breadcrumb[] = [];

  selectedOption = 1;
  selectedLang: Lang;
  currentLocal: string;
  currentView: string;
  appName: string;
  currentTheme: Theme;
  chartTheme: any;

  visibleSidebar = false;
  displayNetDialog = false;
  connecting = false;

  get isDarkTheme(): boolean {
    return this.currentTheme == 'dark';
  }

  @ViewChild('addrOverlay') addrOverlay: OverlayPanel;

  windowScrolled: boolean;
  @HostListener("window:scroll", [])
  onWindowScroll() {
    if (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop > 100) {
      this.windowScrolled = true;
    }
    else if (this.windowScrolled && window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop < 10) {
      this.windowScrolled = false;
    }
  }

  private onChainLoadedRemover: ListenerRemover;

  constructor(
    private titleService: Title,
    private translateService: TranslateService,
    private router: Router,
    @Inject(LOCALE_ID) defLocale: string,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private web3Service: Web3Service,
    private appRef: ApplicationRef,
    public ngZone: NgZone
  ) {

    this.matIconRegistry.addSvgIcon(
      "metamask",
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/svg/metamask.svg")
    );

    this.matIconRegistry.addSvgIcon(
      "option_grid",
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/svg/option_grid.svg")
    );

    this.matIconRegistry.addSvgIcon(
      "excel",
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/svg/excel.svg")
    );

    this.matIconRegistry.addSvgIcon(
      "twitter",
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/svg/twitter.svg")
    );

    this.matIconRegistry.addSvgIcon(
      "discord",
      this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/svg/discord.svg")
    );

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      distinctUntilChanged(),
    ).subscribe((e: NavigationEnd) => {
      //console.log("location: href %s, origin %s, path %s", location.href, location.origin, location.pathname);
      this.currentView = e.url;
      this.setSelectedOption();
      this.breadcrumbs = getBreadcrumbs(e.url);
    });

    AppComponent.instance = this;
    this.currentLocal = getUserLocale(defLocale);
    let localVals = this.currentLocal.split("-");
    let langCode = localVals[0].toLowerCase();

    // Check the value of localStorage
    if (localStorage.language && langMap.get(localStorage.language)) {
      langCode = localStorage.language;
    }
    // Check if the language is supported
    else if (!langMap.get(langCode)) {
      langCode = "en";
    }

    langMap.forEach((value: string, key: string) => {
      let lang = {
        code: key,
        name: value
      };
      this.langs.push(lang);

      if (!this.selectedLang && key == langCode) {
        this.selectedLang = lang;
      }
    });

    this.translateService.setDefaultLang("en");
    this.translateService.use(this.selectedLang.code);
  }

  ngOnInit() {
    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      //this.setTransferListener();
    }, () => {
      return this.loadedChainData;
    });

    this.translateService.get(['']).subscribe(translations => {
      this.appName = this.translateService.instant("app_name");
      this.options = [
        { name: this.translateService.instant("dashboard"), value: 1, icon: 'dashboard' },
        { name: this.translateService.instant("surveys"), value: 2, icon: 'view_list' },
        { name: this.translateService.instant("create_survey"), value: 3, icon: 'edit_note' },
        { name: this.translateService.instant("token_sale"), value: 4, icon: 'stars' }
        //{ name: this.translateService.instant("swap"), value: 5, icon: 'swap_horiz' }
      ];
    });

    this.setTheme(localStorage.theme);
    this.connect();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.onChainLoadedRemover();
  }

  switchTheme() {
    this.setTheme(this.isDarkTheme? 'light': 'dark');
  }

  setSelectedOption() {
    if (this.currentView == '/' || this.isCurrentView('/dashboard')) {
      this.selectedOption = 1;
    } else if (this.isCurrentView('/surveys') || this.isCurrentView('/take-survey') || this.isCurrentView('/answers')) {
      this.selectedOption = 2;
    } else if (this.isCurrentView('/create-survey')) {
      this.selectedOption = 3;
    } else if (this.isCurrentView('/token-sale')) {
      this.selectedOption = 4;
    } /*else if (this.isCurrentView('/swap')) {
      this.selectedOption = 5;
    }*/ else {
      //throw new Error("Unk. view: " + this.currentView);
      console.error("Unk. view: " + this.currentView);
    }
  }

  onOptionChanged(option: number) {
    this.selectedOption = option;
    
    if (this.selectedOption == 1) {
      this.changeRoute('/dashboard');
    } else if (this.selectedOption == 2) {
      this.changeRoute('/surveys');
    } else if (this.selectedOption == 3) {
      this.changeRoute('/create-survey');
    } else if (this.selectedOption == 4) {
      this.changeRoute('/token-sale');
    } /*else if (this.selectedOption == 5) {
      this.changeRoute('/swap');
    }*/ else {
      throw new Error("Unk. option: " + this.selectedOption);
    }
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  setLang(lang: Lang) {
    localStorage.language = lang.code;
    window.location.reload();
  }

  changeRoute(url: string) {
    this.visibleSidebar = false;
    this.router.navigate([url]);
  }

  isCurrentView(url: string) {
    return this.currentView == url || this.currentView.startsWith(url + '/');
  }

  scrollToTop() {
    moveScrollToTop();
  }

  tick() {
    this.appRef.tick();
  }

  async importNetwork() {
    this.displayNetDialog = false;
    await this.web3Service.importNetwork(NET_PARAMS[CURRENT_CHAIN]);
  }

  async importToken() {
    let token = INC_TOKEN[CURRENT_CHAIN];
    await this.web3Service.importToken({
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      image: token.logoURI
    });
  }

  async importWrappedToken() {
    let token = WRAPPED_CURRENCY[CURRENT_CHAIN];
    await this.web3Service.importToken({
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      image: token.logoURI
    });
  }

  async connect() {
    this.connecting = true;

    try {
      await this.web3Service.connect();

      let networkId = await this.web3Service.getNetworkId();
      let networkType = await this.web3Service.getNetworkType();
      let chainId = await this.web3Service.getChainId();
      console.log("networkId: " + networkId + ", networkType: " + networkType + ", chainId: " + chainId);
    } catch (err) {
      console.error("Could not get a wallet connection", err);

      if (this.hasConnection && err?.code == Web3Error.CODE_INVALID_NETWORK) {
        this.displayNetDialog = true;
      }
    } finally {
      this.connecting = false;
    }
  }

  async disconnect() {
    await this.web3Service.disconnect();
    this.addrOverlay.hide();
  }

  async changeWallet() {
    await this.disconnect();
    await this.connect();
  }

  private setTheme(theme: Theme) {
    if(!isTheme(theme)) {
      theme = 'dark';
    }
    
    localStorage.theme = this.currentTheme = theme;

    let themeFile = this.isDarkTheme? 'vela-blue': 'saga-blue';
    let themeLink = document.getElementById('app-theme') as HTMLLinkElement;
    themeLink.href = 'assets/themes/' + themeFile + '/theme.css';

    if(this.isDarkTheme) {
      document.body.classList.add('dark-theme');
		} else {
		  document.body.classList.remove('dark-theme');
		}

    this.web3Service.setModalTheme(theme);

    this.chartTheme = this.isDarkTheme? chartThemeDark: chartThemeLight;

    for (const key in charts) {
      const chart = charts[key];
      if (chart) {
        chart.updateOptions({
          theme: this.chartTheme,
          legend: {
            labels: {
              colors: 'var(--text-color)'
            }
          }
        });
      }
    }

    this.onThemeChanged.fire();
  }

  /*private setTransferListener() {
    let comp = this;
    this.incContract.events.Transfer({}, function (err: any, result: any) {
      const { from, to, value } = result.returnValues;

      if (to.toLowerCase() === comp.accountData.address) {
        setTimeout(() => {
          comp.onReceive(value);
        }, 1000);
      } else if (from.toLowerCase() === comp.accountData.address) {
        setTimeout(() => {
          comp.onSend(value);
        }, 1000);
      }

    }.bind(this));
  }

  private onReceive(value: string) {
    let incAmount = toFormatBigNumber(toAmount(value));
    let message = this.translateService.instant("have_received_x", { val1: incAmount + ' INC' });
    this.messageService.add({
      severity: 'success',
      summary: this.translateService.instant("success"),
      detail: message
    });

    this.web3Service.loadAccountData();
    console.log(message);
  }

  private onSend(value: string) {
    let incAmount = toFormatBigNumber(toAmount(value));
    let message = this.translateService.instant("have_sent_x", { val1: incAmount + ' INC' });
    this.messageService.add({
      severity: 'info',
      summary: this.translateService.instant("info"),
      detail: message
    });

    this.web3Service.loadAccountData();
    console.log(message);
  }*/
}