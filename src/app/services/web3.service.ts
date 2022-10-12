import { Injectable, OnDestroy } from '@angular/core';
import BigNumber from 'bignumber.js';
import { AppComponent } from '../app.component';
import ERC20 from '../contracts/ERC20';
import INCForwarder from '../contracts/INCForwarder';
import INCToken from "../contracts/INCToken";
import TokenOffer from "../contracts/TokenOffer";
import SurveyEngine from '../contracts/SurveyEngine';
import SurveyStorage from '../contracts/SurveyStorage';
import SurveyValidator from '../contracts/SurveyValidator';
import { AccountData } from '../models/account-data';
import { IncProps, OfferProps } from '../models/inc-model';
import { EngineProps, SurveyProps } from '../models/survey-model';
import { CURRENT_CHAIN, WRAPPED_CURRENCY, Theme } from '../shared/constants';
import { providerOptions } from '../shared/provider-options';
import { SimpleListener } from '../shared/simple-listener';
import { Web3Error } from '../models/web3-error';
declare var window: any;
declare var Web3: any;

const Web3Modal = window.Web3Modal.default;
//const evmChains = window.evmChains;

@Injectable({
  providedIn: 'root'
})
export class Web3Service implements OnDestroy {

  get hasConnection(): boolean { return this.web3 != undefined; }
  get loadedChainData(): boolean { return this.accountData != undefined; }

  get web3(): any { return this._web3; }
  get incContract(): any { return this._incContract; }
  get offerContract(): any { return this._offerContract; }
  get surveyContract(): any { return this._surveyContract; }
  get validatorContract(): any { return this._validatorContract; }
  get engineContract(): any { return this._engineContract; }
  get forwarderContract(): any { return this._forwarderContract; }
  get accountData(): AccountData { return this._accountData; }
  get incProps(): IncProps { return this._incProps; }
  get offerProps(): OfferProps { return this._offerProps; }
  get surveyProps(): SurveyProps { return this._surveyProps; }
  get engineProps(): EngineProps { return this._engineProps; }
  get timeDiff(): any { return this._timeDiff; }
  get currenTime(): any { return new Date().getTime() + (this.timeDiff ?? 0); }

  private _web3: any;
  private _incContract: any;
  private _offerContract: any;
  private _surveyContract: any;
  private _validatorContract: any;
  private _engineContract: any;
  private _forwarderContract: any;

  private _accountData: AccountData;
  private _incProps: IncProps;
  private _offerProps: OfferProps;
  private _surveyProps: SurveyProps;
  private _engineProps: EngineProps;
  private _timeDiff: number;

  private web3Modal: any;
  //private intervalId: any;

  onAccountLoaded = new SimpleListener();// (accountData: AccountData) => void;
  onChainLoaded = new SimpleListener();// () => void;

  constructor() {
    this.web3Modal = new Web3Modal({
      network: "mainnet", // optional mainnet, ropsten, etc..
      cacheProvider: true, // optional
      //disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
      providerOptions, // required
    });

    // every 30 seconds
    /*this.intervalId = setInterval(() => {
      if (this.web3) {
        this.loadTimeDiff();
      }
    }, 30000);*/
  }

  ngOnDestroy() {
    //clearInterval(this.intervalId);
    //this.intervalId = undefined;

    this.releaseAll();

    console.log('Web3Service destroyed.');
  }

  async setModalTheme(theme: Theme) {
    this.web3Modal = new Web3Modal({
      network: "mainnet", // optional mainnet, ropsten, etc..
      cacheProvider: true, // optional
      //disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
      providerOptions, // required
      theme: theme
    });
  }

  checkConnection() {
    if (!this.hasConnection) {
      throw new Web3Error(Web3Error.CODE_NOT_CONNECTED, "Web3 not connected.");
    }
  }

  checkContracts() {
    if (!this.forwarderContract) {
      throw new Web3Error(Web3Error.CODE_NOT_LOADED_CONTRACTS, "Not loaded contracts.");
    }
  }

  async getNetworkId(): Promise<number> {
    this.checkConnection();
    let networkId = await this.web3.eth.net.getId();
    return Promise.resolve<number>(parseInt(networkId));
  }

  async getNetworkType(): Promise<string> {
    this.checkConnection();
    let networkType = await this.web3.eth.net.getNetworkType();
    return Promise.resolve<string>(networkType);
  }

  async getChainId(): Promise<number> {
    this.checkConnection();
    let chainId = await this.web3.eth.getChainId();
    return Promise.resolve<number>(parseInt(chainId));
  }

  async getGasPrice(): Promise<BigNumber> {
    this.checkConnection();
    let gasPrice = await this.web3.eth.getGasPrice();
    return Promise.resolve<BigNumber>(new BigNumber(gasPrice));
  }

  async getNonce(address: string): Promise<number> {
    this.checkConnection();
    let nonce = await this.web3.eth.getTransactionCount(address);
    return Promise.resolve<number>(parseInt(nonce));
  }

  async getBlockNumber(): Promise<number> {
    this.checkConnection();
    let blockNumber = await this.web3.eth.getBlockNumber();
    return Promise.resolve<number>(parseInt(blockNumber));
  }

  async getLastBlock(): Promise<any> {
    this.checkConnection();
    let blockNumber = await this.web3.eth.getBlockNumber();
    let block = await this.web3.eth.getBlock(blockNumber);
    return Promise.resolve<any>(block);
  }

  async estimateGas(from: string, to: string, data: string, extra: { value?: BigNumber, gasPrice?: BigNumber } = {}): Promise<BigNumber> {
    this.checkConnection();
    //let nonce = await this.web3.eth.getTransactionCount(from);

    if (!extra.gasPrice) {
      extra.gasPrice = await this.web3.eth.getGasPrice();
    }

    let estimatedGas = await this.web3.eth.estimateGas({
      //nonce: nonce,
      from: from,
      to: to,
      data: data,
      value: extra.value,
      gasPrice: extra.gasPrice
    });
    return Promise.resolve<BigNumber>(new BigNumber(estimatedGas));
  }

  async getTransactionReceipt(hash: string): Promise<any> {
    this.checkConnection();
    let receipt = await this.web3.eth.getTransactionReceipt(hash);
    return Promise.resolve<any>(receipt);
  }

  async getTransaction(hash: string): Promise<any> {
    this.checkConnection();
    let tx = await this.web3.eth.getTransaction(hash);
    return Promise.resolve<any>(tx);
  }

  async getCcyBalance(account: string): Promise<BigNumber> {
    this.checkConnection();
    let balance = await this.web3.eth.getBalance(account);
    return Promise.resolve<BigNumber>(new BigNumber(balance));
  }

  async getIncBalance(account: string): Promise<BigNumber> {
    this.checkContracts();
    let balance = await this.incContract.methods.balanceOf(account).call();
    return Promise.resolve<BigNumber>(new BigNumber(balance));
  }

  async getIncTotalSupply(): Promise<BigNumber> {
    this.checkContracts();
    let totalSupply = await this.incContract.methods.totalSupply().call();
    return Promise.resolve<BigNumber>(new BigNumber(totalSupply));
  }

  async getIncAllowance(owner: string, spender: string): Promise<BigNumber> {
    this.checkContracts();
    let allowance = await this.incContract.methods.allowance(owner, spender).call();
    return Promise.resolve<BigNumber>(new BigNumber(allowance));
  }

  async getERC20Balance(contractAddress: string, userAddress: string): Promise<BigNumber> {
    this.checkConnection();
    let token = await ERC20(this.web3, contractAddress);
    let balance = await token.methods.balanceOf(userAddress).call();
    return Promise.resolve<BigNumber>(new BigNumber(balance));
  }

  async getERC20Contract(contractAddress: string): Promise<any> {
    this.checkConnection();
    let token = await ERC20(this.web3, contractAddress);
    return Promise.resolve<any>(token);
  }

  async getAccountData(): Promise<AccountData> {
    this.checkConnection();
    let data = new AccountData();

    // Get connected chain id from Ethereum node
    data.chainId = await this.getChainId();
    // Load chain information over an HTTP API
    //let chainData = evmChains.getChain(chainId);
    //this.data.networkName = chainData.name;

    // Get list of accounts of the connected wallet
    // MetaMask does not give you all accounts, only the selected account
    let accounts = await this.web3.currentProvider.request({ method: 'eth_requestAccounts' });
    data.address = accounts[0].toLowerCase();

    data.ccyBalance = await this.getCcyBalance(data.address);
    //data.wCcyBalance = await this.getERC20Balance(WRAPPED_CURRENCY[CURRENT_CHAIN].address, data.address);
    data.incBalance = await this.getIncBalance(data.address);

    return Promise.resolve<AccountData>(data);
  }

  async getIncProps(): Promise<IncProps> {
    this.checkContracts();
    let data: any = {};

    data.timelineMaxPerRequest = parseInt(await this.incContract.methods.timelineMaxPerRequest().call());
    data.holderMaxPerRequest = parseInt(await this.incContract.methods.holderMaxPerRequest().call());

    return Promise.resolve<IncProps>(data);
  }

  async getOfferProps(): Promise<OfferProps> {
    this.checkContracts();
    let data: any = {};

    data.openingTime = parseInt(await this.offerContract.methods.openingTime().call());
    data.closingTime = parseInt(await this.offerContract.methods.closingTime().call());
    data.initialRate = parseInt(await this.offerContract.methods.initialRate().call());
    data.finalRate = parseInt(await this.offerContract.methods.finalRate().call());
    data.totalSold = new BigNumber(await this.offerContract.methods.totalSold().call());
    data.totalRaised = new BigNumber(await this.offerContract.methods.totalRaised().call());

    return Promise.resolve<OfferProps>(data);
  }

  async getSurveyProps(): Promise<SurveyProps> {
    this.checkContracts();
    let data: any = {};

    data.surveyMaxPerRequest = parseInt(await this.surveyContract.methods.surveyMaxPerRequest().call());
    data.participantMaxPerRequest = parseInt(await this.surveyContract.methods.participantMaxPerRequest().call());
    data.participationMaxPerRequest = parseInt(await this.surveyContract.methods.participationMaxPerRequest().call());
    data.questionMaxPerRequest = parseInt(await this.surveyContract.methods.questionMaxPerRequest().call());
    data.responseMaxPerRequest = parseInt(await this.surveyContract.methods.responseMaxPerRequest().call());

    return Promise.resolve<SurveyProps>(data);
  }

  async getEngineProps(): Promise<EngineProps> {
    this.checkContracts();
    let data: any = {};

    data.titleMaxLength = parseInt(await this.validatorContract.methods.titleMaxLength().call());
    data.descriptionMaxLength = parseInt(await this.validatorContract.methods.descriptionMaxLength().call());
    data.urlMaxLength = parseInt(await this.validatorContract.methods.urlMaxLength().call());
    data.startMaxTime = parseInt(await this.validatorContract.methods.startMaxTime().call());
    data.rangeMinTime = parseInt(await this.validatorContract.methods.rangeMinTime().call());
    data.rangeMaxTime = parseInt(await this.validatorContract.methods.rangeMaxTime().call());
    data.questionMaxPerSurvey = parseInt(await this.validatorContract.methods.questionMaxPerSurvey().call());
    data.questionMaxLength = parseInt(await this.validatorContract.methods.questionMaxLength().call());
    data.validatorMaxPerQuestion = parseInt(await this.validatorContract.methods.validatorMaxPerQuestion().call());
    data.validatorValueMaxLength = parseInt(await this.validatorContract.methods.validatorValueMaxLength().call());
    data.hashMaxPerSurvey = parseInt(await this.validatorContract.methods.hashMaxPerSurvey().call());
    data.responseMaxLength = parseInt(await this.validatorContract.methods.responseMaxLength().call());
    data.feeWei = new BigNumber(await this.engineContract.methods.fee().call());

    return Promise.resolve<EngineProps>(data);
  }

  async importNetwork(params: any): Promise<boolean> {
    this.checkConnection();
    let wasAdded = false;

    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      wasAdded = await this.web3.currentProvider.request({
        method: 'wallet_addEthereumChain',
        params: [params]
      });
    } catch (err) {
      console.error(err);
    }

    return Promise.resolve(wasAdded);
  }

  async importToken(token: any): Promise<boolean> {
    this.checkConnection();
    let wasAdded = false;

    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      wasAdded = await this.web3.currentProvider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: token.address, // The address that the token is at.
            symbol: token.symbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: token.decimals, // The number of decimals in the token
            image: token.logoURI, // A string url of the token logo
          },
        },
      });
    } catch (err) {
      console.error(err);
    }

    return Promise.resolve(wasAdded);
  }

  async connect() {
    try {
      if (!this.web3) {
        let provider = await this.web3Modal.connect();
        this._web3 = new Web3(provider);

        // Subscribe to provider events
        this.configProvider(provider);

        console.debug("Web3 instance is", this.web3);
      }

      let chainId = await this.getChainId();

      if (chainId != CURRENT_CHAIN) {
        throw new Web3Error(Web3Error.CODE_INVALID_NETWORK, "Invalid network: " + chainId);
      }

      await this.loadChainData();
    } catch (e: any) {
      if (e.code == Web3Error.CODE_INVALID_NETWORK) {
        // Invalid network, release data
        this.releaseData();
      } else {
        // Bad connection, disconnect
        this.disconnect();
      }

      if (e == "Modal closed by user") {
        // User rejected request
        return;
      }

      throw e;
    }
  }

  async disconnect() {
    try {
      if (!this.web3) {
        return;
      }

      console.log("Killing the wallet connection", this.web3.currentProvider);

      // Which providers have close method?
      if (this.web3.currentProvider.close) {
        await this.web3.currentProvider.close();
      } else if (this.web3.currentProvider.disconnect) {
        await this.web3.currentProvider.disconnect();
      }

      // If the cached provider is not cleared, WalletConnect will default 
      // to the existing session  and does not allow to re-scan the QR code 
      // with a new wallet.
      // This is only necessary if the cache has been enabled by `cacheProvider`
      await this.web3Modal.clearCachedProvider();
    } finally {
      this.releaseConnection();
    }
  }

  async loadAccountData(fireEvent = true) {
    this._accountData = await this.getAccountData();
    if (fireEvent) this.onAccountLoaded.fire(this.accountData);
  }

  private async loadChainData() {
    await this.loadTimeDiff();
    await this.loadContracts();
    await this.loadIncProps();
    await this.loadOfferProps();
    await this.loadSurveyProps();
    await this.loadEngineProps();
    // ..
    await this.loadAccountData(false);
    this.onChainLoaded.fire();
  }

  private async loadTimeDiff() {
    let time = new Date().getTime();
    let block = await this.getLastBlock();
    let newTime = new Date().getTime();

    if (block) {
      let elapsedTime = newTime - time;
      this._timeDiff = block.timestamp * 1000 + elapsedTime - newTime;
    }
  }

  private async loadContracts() {
    this._incContract = await INCToken(this.web3);
    this._offerContract = await TokenOffer(this.web3);
    this._surveyContract = await SurveyStorage(this.web3);
    this._validatorContract = await SurveyValidator(this.web3);
    this._engineContract = await SurveyEngine(this.web3);
    this._forwarderContract = await INCForwarder(this.web3);
  }

  private async loadIncProps() {
    this._incProps = await this.getIncProps();
    console.debug("incProps:: " + JSON.stringify(this.incProps));
  }

  private async loadOfferProps() {
    this._offerProps = await this.getOfferProps();
    console.debug("offerProps:: " + JSON.stringify(this.offerProps));
  }

  private async loadSurveyProps() {
    this._surveyProps = await this.getSurveyProps();
    console.debug("surveyProps:: " + JSON.stringify(this.surveyProps));
  }

  private async loadEngineProps() {
    this._engineProps = await this.getEngineProps();
    console.debug("engineProps:: " + JSON.stringify(this.engineProps));
  }

  private configProvider(provider: any) {
    // Subscribe to chainId change
    provider.on("chainChanged", (chainId: number) => {
      console.debug("chainChanged: " + chainId);
      if (AppComponent.instance) {
        AppComponent.instance.ngZone.run(() => {
          AppComponent.instance.connect();
        });
      }
    });

    // Subscribe to accounts change
    // MetaMask bug: this method is called many times for no reason
    provider.on("accountsChanged", (accounts: string[]) => {
      console.debug("accountsChanged: " + accounts);

      if (!accounts[0]) {
        if (AppComponent.instance) {
          AppComponent.instance.ngZone.run(() => {
            AppComponent.instance.disconnect();
          });
        }

        return;
      }

      if (accounts[0].toLowerCase() == this.accountData?.address) {
        return;
      }

      this.loadAccountData();
    });
  }

  private releaseData() {
    this._incContract = undefined;
    this._offerContract = undefined;
    this._surveyContract = undefined;
    this._validatorContract = undefined;
    this._engineContract = undefined;
    this._forwarderContract = undefined;
    this._accountData = undefined;
    this._incProps = undefined;
    this._offerProps = undefined;
    this._surveyProps = undefined;
    this._engineProps = undefined;
    this._timeDiff = undefined;
  }

  private releaseListeners() {
    this.onAccountLoaded.clean();
    this.onChainLoaded.clean();
  }

  private releaseConnection() {
    this._web3 = undefined;
    this.releaseData();
  }

  private releaseAll() {
    this._web3 = undefined;
    this.releaseListeners();
    this.releaseData();
  }
}
