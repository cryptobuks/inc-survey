import { Component, Inject, NgZone, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UtilService } from 'src/app/services/util.service';
import { Web3Service } from 'src/app/services/web3.service';
import { confirmDialog, getTokenLogoURL, ipfsToURL, isEmpty, parseENSAddress, toAmount, toFormatBigNumber, uriToHttp } from 'src/app/shared/helper';
import { COMMON_BASES, DEFAULT_LIST_OF_LISTS_TO_DISPLAY, UNSUPPORTED_LIST_URLS } from 'src/app/shared/token-lists';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { schema, TokenList } from '@uniswap/token-lists';
import { StorageUtil } from 'src/app/shared/storage-util';
import { TranslateService } from '@ngx-translate/core';
import { Web3Error } from 'src/app/models/web3-error';
import BigNumber from 'bignumber.js';
declare var Web3: any;
declare var $: any;

const existsToken = (array: any[], token: any) => (
  array.find(item => item.address.toLowerCase() == token.address.toLowerCase())
);
const matchToken = (token: any, value: string) => (
  isEmpty(value) || token.symbol.toLowerCase().includes(value) || token.name.toLowerCase().includes(value)
);
const existsList = (array: any[], list: any) => (
  array.find(item => item.name.toLowerCase() == list.name.toLowerCase())
);
const activeList = (array: any[], list: any) => (
  array.find(item => item.active && item.name.toLowerCase() == list.name.toLowerCase())
);
const existsAddr = (array: string[], address: string) => (
  array.some(addr => addr.toLowerCase() == address.toLowerCase())
);

const activeColors = [
  "#4b5de4", "#958c12", "#0085cc", "#953579", "#c747a3", "#579575",
  "#367f8d", "#2193b9", "#8d8878", "#839557", "#736221", "#777777"
];

@Component({
  selector: 'app-token-selector',
  templateUrl: './token-selector.component.html',
  styleUrls: ['./token-selector.component.css']
})
export class TokenSelectorComponent implements OnInit {

  unsupportedTokens: string[];
  bases: any[];
  tokens: any[];
  tokensToShow: any[];
  lists: any[];
  customTokens: any[];
  suggestedTokens: any[];
  balanceCache = {};

  viewIndex = 0;
  loadingTokens = false;
  loadingLists = false;
  loadingCustomTokens = false;
  searchingTokens = false;// TODO not used from view

  tokenFilter: string;
  listFilter: string;
  customTokenFilter: string;

  listTag: any;
  listError: string;

  customTokenTag: any;
  customTokenError: string;

  jqElement: any;
  validate: ValidateFunction;

  get web3(): any { return this.web3Service.web3; };
  get accountData(): any { return this.web3Service.accountData; };

  constructor(
    public dialogRef: MatDialogRef<TokenSelectorComponent>,
    private translateService: TranslateService,
    private utilService: UtilService,
    private web3Service: Web3Service,
    private ngZone: NgZone,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    /*this.bases = typeof data.chainId !== 'undefined' ? COMMON_BASES[data.chainId] ?? [] : [];

    this.bases.forEach((currency: any) => {
      if (!currency.logoURI) {
        currency.logoURI = getCurrencyLogoURL(currency);
      }
    });*/
  }

  ngOnInit(): void {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    this.validate = ajv.compile(schema);
    this.loadUnsupportedTokens();
  }

  ngAfterViewInit() {
    let nativeElement = this.dialogRef['_containerInstance']['_elementRef'].nativeElement;
    this.jqElement = $(nativeElement);
    this.setScrollEvent();

    setTimeout(() => {
      this.loadTokens();
    });
  }

  ngAfterViewChecked() {
    this.setScrollEvent();
  }

  onListChanged(url: string, active: boolean) {
    StorageUtil.setActiveList(url, active);
    // Better get organized the next time the user opens the list.
    //this.sortLists(this.listsToShow); 
    this.checkListTag();
  }

  close() {
    this.dialogRef.close();
  }

  selectToken(token: any) {
    this.dialogRef.close(token);
  }

  backToSelector() {
    this.viewIndex = 0;
    this.loadTokens();
  }

  goManageLists() {
    this.viewIndex = 1;
    this.loadLists();
  }

  goManageTokens() {
    this.viewIndex = 2;
    this.loadCustomTokens();
  }

  hasTokens() {
    return this.tokensToShow && this.tokensToShow.length > 0;
  }

  hasLists() {
    return this.lists && this.lists.length > 0;
  }

  hasCustomTokens() {
    return this.customTokens && this.customTokens.length > 0;
  }

  hasSuggestedTokens() {
    return this.suggestedTokens && this.suggestedTokens.length > 0;
  }

  /*getIcon(token: any) {
    return getCurrencyLogoURL(token);
  }*/

  getBalance(token: any) {
    return token.hfBalance ?? '';
  }

  isSelectedToken(token: any) {
    return token.symbol == this.data.symbol && token.address == this.data.address;
  }

  isCutomList(url: string) {
    return !DEFAULT_LIST_OF_LISTS_TO_DISPLAY.includes(url);
  }

  // filter by name, symbol or address
  searchToken(value: string) {
    if (this.loadingTokens) {
      return;
    }

    this.suggestedTokens = [];
    value = value ? value.trim().toLowerCase() : '';
    if (value.length == 0) {
      this.tokensToShow = this.tokens;
      return;
    }

    if (Web3.utils.isAddress(value)) {
      this.tokensToShow = this.tokens.filter((tkn: any) => (
        tkn.address.toLowerCase() == value
      ));

      if (this.tokensToShow.length == 0) {
        this.loadSuggestedTokensByAddress(value);
      }
    } else {
      this.tokensToShow = this.tokens.filter((tkn: any) => matchToken(tkn, value));

      if (value.length >= 3) {
        this.loadSuggestedTokensByValue(value);
      }
    }
  }

  importSuggestedToken(token: any) {
    let title = this.translateService.instant("import_token");
    let message = this.translateService.instant("token_not_appear_on_active_lists");

    confirmDialog(title, message, () => {
      this.ngZone.run(() => {
        this.storeSuggestedTokenAndReload(token);
      });
    });
  }

  // https://, ipfs:// or ENS name
  searchList(value: string) {
    if (this.loadingLists) {
      return;
    }

    this.listTag = null;
    this.listError = null;

    value = value ? value.trim().toLowerCase() : '';
    if (value.length == 0) {
      return;
    }

    let urls = uriToHttp(value);

    if (urls && urls.length > 0) {
      this.addListTag(urls);
    } else {
      let ensUri = parseENSAddress(value);

      if (ensUri) {
        this.searchENS(ensUri);
      } else {
        this.listError = this.translateService.instant("enter_valid_list_location");
      }
    }
  }

  importList() {
    if (this.listTag && !StorageUtil.isDisplayList(this.listTag.url)) {
      this.storeListAndReload();
    }
  }

  searchCustomToken(value: string) {
    if (this.loadingCustomTokens) {
      return;
    }

    this.customTokenTag = null;
    this.customTokenError = null;

    value = value ? value.trim().toLowerCase() : '';
    if (value.length == 0) {
      return;
    }

    if (Web3.utils.isAddress(value)) {
      this.addCustomTokenTag(value);
    } else {
      this.customTokenError = this.translateService.instant("enter_valid_address");
    }
  }

  importCustomToken() {
    if (this.customTokenTag && !StorageUtil.isAddedToken(this.customTokenTag.address)) {
      if (this.customTokenTag.exists) {
        this.storeCustomTokenAndReload();
      } else {
        let title = this.translateService.instant("import_token");
        let message = this.translateService.instant("token_not_appear_on_active_lists");

        confirmDialog(title, message, () => {
          this.ngZone.run(() => {
            this.storeCustomTokenAndReload();
          });
        });
      }
    }
  }

  viewList(url: string) {
    window.open(`https://tokenlists.org/token-list?url=${url}`, '_blank');
  }

  removeList(url: string) {
    let title = this.translateService.instant("remove_list");
    let message = this.translateService.instant("sure_delete_this_list");
    confirmDialog(title, message, () => {
      this.ngZone.run(() => {
        StorageUtil.removeList(url);
        this.loadLists();
      });
    });
  }

  viewCustomToken(address: string) {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  }

  removeCustomToken(address: string) {
    let title = this.translateService.instant("remove_token");
    let message = this.translateService.instant("sure_delete_this_token");
    confirmDialog(title, message, () => {
      this.ngZone.run(() => {
        StorageUtil.removeToken(address);
        this.loadCustomTokens();
      });
    });
  }

  removeCustomTokens() {
    let title = this.translateService.instant("remove_all");
    let message = this.translateService.instant("sure_delete_all_imported_tokens");
    confirmDialog(title, message, () => {
      this.ngZone.run(() => {
        StorageUtil.removeTokens();
        this.loadCustomTokens();
      });
    });
  }

  private setScrollEvent() {
    let jqHeader = $('.dialog-title', this.jqElement);
    let jqContent = $('.dialog-content', this.jqElement);
    jqContent.unbind('scroll');

    jqContent.on('scroll', function (event: any) {
      let scrollOffset = event.target.scrollTop;
      //let jqHeader = $(this).parent().find('.dialog-title');
      let classFound = jqHeader.hasClass("dialog-title-border");

      if (scrollOffset > 0) {
        if (!classFound) {
          jqHeader.addClass("dialog-title-border");
        }
      } else if (classFound) {
        jqHeader.removeClass("dialog-title-border");
      }
    });
  }

  private isTokenViewVisible() {
    return this.viewIndex == 0 && this.jqElement.is(':visible');
  }

  private isListViewVisible() {
    return this.viewIndex == 1 && this.jqElement.is(':visible');
  }

  private isCustomTokenViewVisible() {
    return this.viewIndex == 2 && this.jqElement.is(':visible');
  }

  private async loadNewToken(address: string): Promise<any> {
    let tokenData = await this.web3Service.loadToken(address, true);

    let token = {
      chainId: tokenData.chainId,
      address: tokenData.address,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      balance: tokenData.balance,
      hfBalance: tokenData.hfBalance,
      logoURI: tokenData.logoURI,
      isToken: true,
      added: true
    };
    return Promise.resolve<any>(token);
  }

  private complementAddedToken(token: any) {
    token.logoURI = token.logoURI ? ipfsToURL(token.logoURI) : getTokenLogoURL(token.chainId, token.address);
    token.isToken = true;
    token.added = true;
  }

  private addToken(token: any) {
    StorageUtil.addToken({
      chainId: token.chainId,
      address: token.address,
      decimals: token.decimals,
      name: token.name,
      symbol: token.symbol,
      logoURI: token.logoURI
    });
  }

  private loadListItem(url: string, list: any) {
    let count = list.tokens.filter((tkn: any) => tkn.chainId === this.data.chainId).length;
    //let colorIndex = randomIntFromInterval(0, activeColors.length - 1);

    return {
      url: url,
      name: list.name,
      version: `v${list.version.major}.${list.version.minor}.${list.version.patch}`,
      logoURI: ipfsToURL(list.logoURI),
      count: count,
      //color: activeColors[colorIndex],// color when is checked
      active: StorageUtil.isActiveList(url)
    };
  }

  private setActiveColors(lists: any[]) {
    let colorIndex = 0;
    for(let i = 0; i < lists.length; i++) {
      if(colorIndex >= activeColors.length) {
        colorIndex = 0;
      }

      lists[i].color = activeColors[colorIndex++];
    }
  }

  private async loadBalances(tokens: any[], checkCompVisiblity: () => boolean, defaultValue: string) {
    for (let i = 0; i < tokens.length; i++) {
      if (!checkCompVisiblity()) {
        return;
      }

      let token = tokens[i];
      let balance: any;
      if(balance = this.balanceCache[token.address]) {
        token.balance = new BigNumber(balance);
        token.hfBalance = !token.balance.isNaN() ? toFormatBigNumber(toAmount(token.balance, token.decimals)) : defaultValue;
        return;
      }

      try {
        await this.web3Service.loadTokenBalance(token, defaultValue);
        this.balanceCache[token.address] = token.balance;
      } catch (error) {
        console.error("Failed to get balance for " + token.symbol);
      }
    }

    // sort again by balance & symbol
    this.sortTokens(this.tokens);
  }

  // Order tokens, first with balance, next by symbol
  private sortTokens(tokens: any[]) {
    let symbolComparator = (a: any, b: any) => a.symbol.localeCompare(b.symbol);
    tokens.sort((a, b) => (a.hfBalance == b.hfBalance ? symbolComparator(a, b) : a.hfBalance? -1 : 1));
  }

  // Order lists, first active, next by tokens count
  private sortLists(lists: any[]) {
    let countComparator = (a: any, b: any) => (a.count == b.count ? 0 : (a.count > b.count ? -1 : 1));
    lists.sort((a, b) => (a.active == b.active ? countComparator(a, b) : a.active ? -1 : 1));
  }

  private async loadUnsupportedTokens() {
    this.unsupportedTokens = [];

    for (const url of UNSUPPORTED_LIST_URLS) {
      let list: TokenList = await this.utilService.loadJson(url);

      if (!this.validate(list) || !list?.tokens) {
        continue;
      }

      for (const tokenInfo of list.tokens) {
        this.unsupportedTokens.push(tokenInfo.address);
      }
    }
  }

  private async loadTokens() {
    this.bases = [];
    this.tokens = [];
    this.tokensToShow = [];
    this.loadingTokens = true;
    let activeListUrls = StorageUtil.activeLists.filter((url: string) => !UNSUPPORTED_LIST_URLS.includes(url));

    if (activeListUrls.length == 0) {
      this.loadingTokens = false;
      return;
    }

    let tmpList = [];

    // add ETH as first token - if uncommented, must change hasTokens()
    //tmpList.push(this.bases[0]);

    // load tokens from active lists
    for (const url of activeListUrls) {
      if (!this.isTokenViewVisible()) {
        this.loadingTokens = false;
        return;
      }

      let list: TokenList = await this.utilService.loadJson(url);

      if (!this.validate(list) || !list?.tokens) {
        continue;
      }

      for (const tokenInfo of list.tokens) {
        if (!this.isTokenViewVisible()) {
          this.loadingTokens = false;
          return;
        }

        if(tokenInfo.chainId != this.data.chainId) {
          continue;
        }

        if(existsAddr(COMMON_BASES[this.data.chainId], tokenInfo.address) && !existsToken(this.bases, tokenInfo)) {
          this.bases.push(tokenInfo);
        }

        if (!existsToken(tmpList, tokenInfo)) {
          tokenInfo.logoURI = tokenInfo.logoURI ? ipfsToURL(tokenInfo.logoURI) : getTokenLogoURL(tokenInfo.chainId, tokenInfo.address);
          tmpList.push(tokenInfo);
        }
      }
    }

    // include user added tokens
    let addedTokens = StorageUtil.addedTokens;

    for (const token of addedTokens) {
      if (!this.isTokenViewVisible()) {
        this.loadingTokens = false;
        return;
      }

      if (token.chainId == this.data.chainId && !existsToken(tmpList, token)) {
        this.complementAddedToken(token);
        tmpList.push(token);
      }
    }

    // sort by symbol
    //tmpList.sort((a, b) => a.symbol.localeCompare(b.symbol));
    this.sortTokens(tmpList);
    this.tokensToShow = this.tokens = tmpList.filter(item => !existsAddr(this.unsupportedTokens, item.address));
    this.checkListTag();
    this.loadingTokens = false;

    // load balances
    this.loadBalances(this.bases, () => { return this.isTokenViewVisible(); }, undefined);
    this.loadBalances(this.tokens, () => { return this.isTokenViewVisible(); }, '0');

    // apply filter
    this.searchToken(this.tokenFilter);
  }

  private async loadLists() {
    this.lists = [];
    this.loadingLists = true;
    let listUrls = StorageUtil.displayLists.filter((url: string) => !UNSUPPORTED_LIST_URLS.includes(url));

    if (listUrls.length == 0) {
      this.loadingLists = false;
      return;
    }

    let tmpList = [];

    // load lists
    for (const url of listUrls) {
      if (!this.isListViewVisible()) {
        this.loadingLists = false;
        return;
      }

      let list: any;

      try {
        list = await this.utilService.loadJson(url);
      } catch (error) {
        console.error("Failed to load list: " + url);
        continue;
      }

      if (this.validate(list) && !existsList(tmpList, list)) {
        tmpList.push(this.loadListItem(url, list));
      }
    }

    // sort by active & count
    this.sortLists(tmpList);
    this.setActiveColors(tmpList);
    this.lists = tmpList;
    this.loadingLists = false;
  }

  private async loadCustomTokens() {
    this.customTokens = [];
    this.loadingCustomTokens = true;
    let addedTokens = StorageUtil.addedTokens.filter(item => !existsAddr(this.unsupportedTokens, item.address));

    if (addedTokens.length == 0) {
      this.loadingCustomTokens = false;
      return;
    }

    let tmpList = [];

    // load lists
    for (const token of addedTokens) {
      if (!this.isCustomTokenViewVisible()) {
        this.loadingCustomTokens = false;
        return;
      }

      if (token.chainId == this.data.chainId && !existsToken(tmpList, token)) {
        this.complementAddedToken(token);
        tmpList.push(token);
      }
    }

    // sort by symbol
    //tmpList.sort((a, b) => a.symbol.localeCompare(b.symbol));
    this.sortTokens(tmpList);
    this.customTokens = tmpList;
    this.checkCustomTokenTag();
    this.loadingCustomTokens = false;

    // load balances
    //this.loadBalances(this.customTokens, () => { return this.isCustomTokenViewVisible(); }, '0');
  }

  private loadSuggestedTokensByAddress(address: string) {
    this.suggestedTokens = [];
    this.searchingTokens = true;
    let token = this.loadNewToken(address);

    if (token) {
      this.suggestedTokens.push(token);
    }

    this.searchingTokens = false;
  }

  private async loadSuggestedTokensByValue(value: string) {
    this.suggestedTokens = [];
    this.searchingTokens = true;
    let activeListUrls = StorageUtil.activeLists.filter((url: string) => !UNSUPPORTED_LIST_URLS.includes(url));
    let listUrls = StorageUtil.displayLists.filter((url: string) => !UNSUPPORTED_LIST_URLS.includes(url) && !activeListUrls.includes(url));

    if (listUrls.length == 0) {
      this.searchingTokens = false;
      return;
    }

    for (const url of listUrls) {
      if (!this.isTokenViewVisible()) {
        this.searchingTokens = false;
        return;
      }

      let list: TokenList = await this.utilService.loadJson(url);

      if (!this.validate(list) || !list?.tokens) {
        continue;
      }

      for (const tokenInfo of list.tokens) {
        if (!this.isTokenViewVisible()) {
          this.searchingTokens = false;
          return;
        }

        if (tokenInfo.chainId == this.data.chainId && !existsToken(this.suggestedTokens, tokenInfo) &&
          !existsToken(this.tokens, tokenInfo) && matchToken(tokenInfo, value)) {
          tokenInfo.logoURI = tokenInfo.logoURI ? ipfsToURL(tokenInfo.logoURI) : getTokenLogoURL(tokenInfo.chainId, tokenInfo.address);
          this.suggestedTokens.push(tokenInfo);
        }
      }
    }

    this.searchingTokens = false;
  }

  private storeSuggestedTokenAndReload(token: any) {
    this.suggestedTokens = this.suggestedTokens.filter(item => item.address.toLowerCase() !== token.address.toLowerCase());
    this.addToken(token);
    this.loadTokens();
  }

  /**
   * contenthash: {protocolType: 'ipfs', decoded: 'QmVmmSbZVmcWBaDGu93nB2dDPHCCxLmJG1tjeDvrdLggmo', error: null}
   * result for ipfs protocol: https://ipfs.io/ipfs/QmVmmSbZVmcWBaDGu93nB2dDPHCCxLmJG1tjeDvrdLggmo
   */
  private async searchENS(ensUri: any) {
    /*const addr = await this.web3.eth.ens.getAddress(value);
    console.log(addr);*/

    try {
      this.web3Service.checkConnection();
    } catch (error) {
      this.listError = this.translateService.instant("please_connect_your_wallet");
      return
    }

    let contenthash: any;

    try {
      contenthash = await this.web3.eth.ens.getContenthash(ensUri.ensName);
    } catch (error) {
      this.listError = this.translateService.instant("could_not_get_contenthash");
      return;
    }

    if (contenthash?.decoded) {
      let protocol = contenthash.protocolType ?? 'ipfs';
      let uri = protocol + '://' + contenthash.decoded;
      if (ensUri.ensPath) {
        uri += ensUri.ensPath;
      }

      let urls = uriToHttp(uri);

      if (urls && urls.length > 0) {
        this.addListTag(urls);
      }
    }
  }

  private async addListTag(urls: string[]) {
    let list: any;
    let usedUrl: string;

    for (let url of urls) {
      try {
        list = await this.utilService.loadJson(url);
        if (list) {
          usedUrl = url;
          break;
        }
      } catch (error) {
        console.error("Failed to load list: " + url);
      }
    }

    if (!list) {
      this.listError = this.translateService.instant("list_could_not_be_loaded");
      return;
    }

    if (!this.validate(list)) {
      this.listError = this.translateService.instant("invalid_list");
      return;
    }

    this.listTag = this.loadListItem(usedUrl, list);
    this.checkListTag();
  }

  private checkListTag() {
    if (this.listTag) {
      this.listTag.exists = existsList(this.lists, this.listTag);
      this.listTag.active = this.listTag.exists && activeList(this.lists, this.listTag);
    }
  }

  private storeListAndReload() {
    StorageUtil.addList(this.listTag.url);
    this.listTag.exists = true;
    this.loadLists();
  }

  private async addCustomTokenTag(address: string) {
    let token: any;

    try {
      token = await this.loadNewToken(address);
    } catch (error) {
      if (error.code == Web3Error.CODE_FAILED_CONNECTION) {
        this.customTokenError = this.translateService.instant("please_connect_your_wallet");
      } else if (error.code == Web3Error.CODE_NOT_FOUNT_CONTRACT) {
        this.customTokenError = this.translateService.instant("token_not_found");
      } else if (error.code == Web3Error.CODE_INVALID_TOKEN) {
        this.customTokenError = this.translateService.instant("invalid_token");
      }

      return;
    }

    if (token.chainId != this.data.chainId) {
      this.customTokenError = this.translateService.instant("different_chain_id");
      return;
    }

    this.customTokenTag = token;
    this.checkCustomTokenTag();
  }

  private checkCustomTokenTag() {
    if (this.customTokenTag) {
      this.customTokenTag.exists = existsToken(this.customTokens, this.customTokenTag);
      this.customTokenTag.active = this.customTokenTag.exists || existsToken(this.tokens, this.customTokenTag);
    }
  }

  private storeCustomTokenAndReload() {
    this.addToken(this.customTokenTag);
    this.customTokenTag.exists = true;
    this.loadCustomTokens();
  }
}
