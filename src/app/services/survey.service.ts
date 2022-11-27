import { Injectable, OnDestroy } from '@angular/core';
import BigNumber from 'bignumber.js';
import { QuestionImpl } from '../models/question-impl';
import { SurveyImpl } from '../models/survey-impl';
import { ConfigProps, Survey, Question, QuestionValidator, Participation, SurveyAmounts, ResponseCount, SurveyRequest } from '../models/survey-model';
import { RESPONSE_TYPE, SurveyState } from '../models/survey-support';
import { calcFeeTotal, calcGasMargin, filterOutliers } from '../shared/helper';
import { IpfsService } from './ipfs.service';
import { Web3Service } from './web3.service';
import { FwdRequest } from '../models/fwd-request';
import { AccountData } from '../models/account-data';
import { UtilService } from './util.service';
import { ListIterator } from '../models/list-iterator';
import { ListenerRemover } from '../shared/simple-listener';
import { SurveyFilter } from '../models/survey-filter';
import { SurveySearchResult } from '../models/survey-search-result';
declare var keccak256: any;

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
];

const ForwardRequest = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'gas', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'data', type: 'bytes' }
];

@Injectable({
  providedIn: 'root'
})
export class SurveyService implements OnDestroy {

  get web3(): any { return this.web3Service.web3; };
  get accountData(): AccountData { return this.web3Service.accountData; };

  get surveyContract(): any { return this.web3Service.surveyContract; };
  get validatorContract(): any { return this.web3Service.validatorContract; };
  get configContract(): any { return this.web3Service.configContract; }
  get engineContract(): any { return this.web3Service.engineContract; };
  get forwarderContract(): any { return this.web3Service.forwarderContract; };
  get configProps(): ConfigProps { return this.web3Service.configProps; };

  get txGasWgtSamples(): number[] { return this._txGasWgtSamples; };
  get minTxGas(): number { return this._minTxGas; };
  get avgTxGas(): number { return this._avgTxGas; };

  private onChainLoadedRemover: ListenerRemover;
  private _txGasWgtSamples: number[];// weighted samples
  private _minTxGas: number;
  private _avgTxGas: number;

  constructor(
    private web3Service: Web3Service, 
    private ipfsService: IpfsService,
    private utilService: UtilService) {
    this.onChainLoadedRemover = this.web3Service.onChainLoaded.addAndFire(() => {
      this.loadChainData();
    }, () => {
      return this.web3Service.loadedChainData;
    });
  }

  ngOnDestroy() {
    this.onChainLoadedRemover();
    console.log('SurveyService destroyed.');
  }

  checkConnection() {
    this.web3Service.checkConnection();
  }

  checkContracts() {
    this.web3Service.checkContracts();
  }

  // ### Survey functions ###

  async txGasSamples(maxLength: number): Promise<number[]> {
    this.checkContracts();
    let samples = await this.surveyContract.methods.txGasSamples(maxLength).call();
    const arrOfNum = samples.map((str: string) => {
      return parseInt(str);
    });
    return Promise.resolve<number[]>(arrOfNum);
  }

  async remainingBudgetOf(surveyAddr: string): Promise<BigNumber> {
    this.checkContracts();
    let remainingBudget = await this.surveyContract.methods.remainingBudgetOf(surveyAddr).call();
    return Promise.resolve<BigNumber>(new BigNumber(remainingBudget));
  }

  async remainingGasReserveOf(surveyAddr: string): Promise<BigNumber> {
    this.checkContracts();
    let remainingGasReserve = await this.surveyContract.methods.remainingGasReserveOf(surveyAddr).call();
    return Promise.resolve<BigNumber>(new BigNumber(remainingGasReserve));
  }

  async amountsOf(surveyAddr: string): Promise<SurveyAmounts> {
    this.checkContracts();
    let amounts = await this.surveyContract.methods.remainingAmountsOf(surveyAddr).call();
    let partNum = await this.surveyContract.methods.getParticipantsLength(surveyAddr).call();
    return Promise.resolve<SurveyAmounts>({
      remainingBudget: new BigNumber(amounts[0]), 
      remainingGasReserve: new BigNumber(amounts[1]),
      participantNumber: parseInt(partNum)
    });

    /* TODO use amountsOf()
    let amounts = await this.surveyContract.methods.amountsOf(surveyAddr).call();
    return Promise.resolve<RemainingAmounts>({
      remainingBudget: new BigNumber(amounts[0]), 
      remainingGasReserve: new BigNumber(amounts[1]),
      participantNumber: parseInt(amounts[2])
    });*/
  }

  async toSurveyImpl(survey: Survey, questions: QuestionImpl[]): Promise<SurveyImpl> {
    this.checkContracts();
    let tokenData = await this.web3Service.loadToken(survey.token);
    let imageData = await this.ipfsService.ipfsImage(survey.logoUrl);
    return Promise.resolve<SurveyImpl>(SurveyImpl.toImpl(survey, tokenData, imageData, questions));
  }

  // ### Surveys ###

  async getSurveysLength(): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getSurveysLength().call();
    return Promise.resolve<number>(parseInt(length));
  }

  async getAddresses(cursor: number, length: number): Promise<string[]> {
    this.checkContracts();
    let addresses = await this.surveyContract.methods.getAddresses(cursor, length).call();
    return Promise.resolve<string[]>(addresses);
  }

  async getSurveys(cursor: number, length: number): Promise<SurveyImpl[]> {
    this.checkContracts();
    let surveys = await this.surveyContract.methods.getSurveys(cursor, length).call();
    let impls: SurveyImpl[] = [];

    for(let survey of surveys) {
      let impl = await this.toSurveyImpl(survey, []);
      impls.push(impl);
    }

    return Promise.resolve<SurveyImpl[]>(impls);
  }

  async findSurvey(surveyAddr: string): Promise<SurveyImpl> {
    this.checkContracts();
    let survey = await this.surveyContract.methods.findSurvey(surveyAddr).call();
    let impl = await this.toSurveyImpl(survey, []);
    return Promise.resolve<SurveyImpl>(impl);
  }

  async isOpenedSurvey(surveyAddr: string, offset: number): Promise<boolean> {
    this.checkContracts();
    let opened = await this.surveyContract.methods.isOpenedSurvey(surveyAddr, offset).call();
    return Promise.resolve<boolean>(opened);
  }

  // ### Own Surveys ###

  async getOwnSurveysLength(): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getOwnSurveysLength().call({ from : this.accountData.address });
    return Promise.resolve<number>(parseInt(length));
  }

  async getOwnSurvey(index: number): Promise<SurveyImpl> {
    let surveys = await this.getOwnSurveys(index, 1);
    return surveys[0];
  }
  
  async getOwnSurveys(cursor: number, length: number): Promise<SurveyImpl[]> {
    this.checkContracts();
    let surveys = await this.surveyContract.methods.getOwnSurveys(cursor, length).call({ from : this.accountData.address });
    let impls: SurveyImpl[] = [];

    for(let survey of surveys) {
      let impl = await this.toSurveyImpl(survey, []);
      impls.push(impl);
    }

    return Promise.resolve<SurveyImpl[]>(impls);
  }

  // ### Questions ###

  async getQuestionsLength(surveyAddr: string): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getQuestionsLength(surveyAddr).call();
    return Promise.resolve<number>(parseInt(length));
  }

  async getQuestion(surveyAddr: string, index: number): Promise<QuestionImpl> {
    let questions = await this.getQuestions(surveyAddr, index, 1);
    return questions[0];
  }

  async getQuestions(surveyAddr: string, cursor: number, length: number): Promise<QuestionImpl[]> {
    this.checkContracts();
    let questions = await this.surveyContract.methods.getQuestions(surveyAddr, cursor, length).call();
    let impls: QuestionImpl[] = [];

    for(let question of questions) {
      impls.push(QuestionImpl.toImpl(question, []));
    }

    return Promise.resolve<QuestionImpl[]>(impls);
  }

  // ### Validators ###

  async getValidatorsLength(surveyAddr: string, questionIndex: number): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getValidatorsLength(surveyAddr, questionIndex).call();
    return Promise.resolve<number>(parseInt(length));
  }

  async getValidators(surveyAddr: string, questionIndex: number): Promise<QuestionValidator[]> {
    this.checkContracts();
    let validators = await this.surveyContract.methods.getValidators(surveyAddr, questionIndex).call();
    return Promise.resolve<QuestionValidator[]>(validators);
  }

  // ### Participants ###

  async getParticipantsLength(surveyAddr: string): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getParticipantsLength(surveyAddr).call();
    return Promise.resolve<number>(parseInt(length));
  }

  async getParticipant(surveyAddr: string, index: number): Promise<string> {
    let accounts = await this.getParticipants(surveyAddr, index, 1);
    return accounts[0];
  }

  async getParticipants(surveyAddr: string, cursor: number, length: number): Promise<string[]> {
    this.checkContracts();
    let accounts = await this.surveyContract.methods.getParticipants(surveyAddr, cursor, length).call();
    return Promise.resolve<string[]>(accounts);
  }

  async isParticipant(surveyAddr: string, account: string): Promise<boolean> {
    this.checkContracts();
    let alreadyParticipated = await this.surveyContract.methods.isParticipant(surveyAddr, account).call();
    return Promise.resolve<boolean>(alreadyParticipated);
  }

  async isUserParticipant(surveyAddr: string): Promise<boolean> {
    return this.isParticipant(surveyAddr, this.accountData.address);
  }

  // ### Participations ###

  async getParticipation(surveyAddr: string, index: number): Promise<Participation> {
    let parts = await this.getParticipations(surveyAddr, index, 1);
    return parts[0];
  }

  async getParticipations(surveyAddr: string, cursor: number, length: number): Promise<Participation[]> {
    this.checkContracts();
    let parts = await this.surveyContract.methods.getParticipations(surveyAddr, cursor, length).call();
    return Promise.resolve<Participation[]>(parts);
  }

  async findParticipation(surveyAddr: string, account: string): Promise<Participation> {
    this.checkContracts();
    let part = await this.surveyContract.methods.findParticipation(surveyAddr, account).call();
    return Promise.resolve<Participation>(part);
  }

  // ### Own Participations ###

  async getOwnParticipationsLength(): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getOwnParticipationsLength().call({ from : this.accountData.address });
    return Promise.resolve<number>(parseInt(length));
  }

  async getOwnParticipation(index: number): Promise<Participation> {
    let parts = await this.getOwnParticipations(index, 1);
    return parts[0];
  }

  async getOwnParticipations(cursor: number, length: number): Promise<Participation[]> {
    this.checkContracts();
    let parts = await this.surveyContract.methods.getOwnParticipations(cursor, length).call({ from : this.accountData.address });
    return Promise.resolve<Participation[]>(parts);
  }

  async findOwnParticipation(surveyAddr: string): Promise<Participation> {
    this.checkContracts();
    let part = await this.surveyContract.methods.findOwnParticipation(surveyAddr).call({ from : this.accountData.address });
    return Promise.resolve<Participation>(part);
  }

  // ### Responses ###

  async getResponses(surveyAddr: string, questionIndex: number, cursor: number, length: number): Promise<string[]> {
    this.checkContracts();
    let responses = await this.surveyContract.methods.getResponses(surveyAddr, questionIndex, cursor, length).call();
    return Promise.resolve<string[]>(responses);
  }

  async getResponseCounts(surveyAddr: string, questionIndex: number): Promise<ResponseCount[]> {
    this.checkContracts();
    let responses = await this.surveyContract.methods.getResponseCounts(surveyAddr, questionIndex).call();
    responses = responses.map((rc: ResponseCount) => {
      return { value: rc.value, count: parseInt(rc.count+'') };
    });
    return Promise.resolve<ResponseCount[]>(responses);
  }

  getResponseIterator(surveyAddr: string, questionIndex: number, totalLength: number): ListIterator<string[]> {
    this.checkContracts();

    const iterator: ListIterator<string[]> = {
      cursor: 0,
      hasNext: function (): boolean {
        return iterator.cursor < totalLength;
      }.bind(this),
      next: async function () {
        let length = this.configProps.responseMaxPerRequest;
        if (iterator.cursor + length > totalLength) {
          length = totalLength - iterator.cursor;
        }
        let responses = await this.getResponses(surveyAddr, questionIndex, iterator.cursor, length);
        iterator.cursor += length;
        return responses;
      }.bind(this)
    };

    return iterator;
  }

  // ### Engine functions ###

  async sendSurvey(surveyImpl: SurveyImpl) {
    this.checkContracts();
    let account = this.accountData.address;
    let newSurvey: SurveyRequest = {
      title: surveyImpl.title,
      description: surveyImpl.description?? '',
      logoUrl: surveyImpl.logoUrl?? '',
      startTime: Math.round(surveyImpl.startDate.getTime() / 1000),
      endTime: Math.round(surveyImpl.endDate.getTime() / 1000),
      budget: surveyImpl.budget.toFixed(0),
      reward: surveyImpl.reward.toFixed(0),
      token: surveyImpl.tokenData.address
    };
    let questions: Question[] = [];
    let validators: QuestionValidator[] = [];
    let hashes: string[] = [];

    for(let i = 0; i < surveyImpl.questions.length; i++) {
      let question = surveyImpl.questions[i];
      let newQuestion: Question = {
        content: JSON.stringify(QuestionImpl.minifyContent(question.content)),
        mandatory: question.mandatory,
        responseType: RESPONSE_TYPE[question.content.componentType]
      };
      questions.push(newQuestion);

      for(let validator of question.validators) {
        let newValidator: QuestionValidator = {
          questionIndex: i,
          operator: validator.operator,
          expression: validator.expression,
          value: validator.value?? ''
        };
        validators.push(newValidator);
      }
    }

    for(let i = 0; i < surveyImpl.partKeys.length; i++) {
      let hash = '0x' + keccak256(surveyImpl.partKeys[i]);
      let shortHash = hash.substring(2, 6) + hash.substring(hash.length-4, hash.length);
      hashes[i] = shortHash;
    }

    let gasPrice = await this.web3Service.getGasPrice();
    let totalFee = calcFeeTotal(surveyImpl.budget, surveyImpl.reward, this.configProps.feeWei);
    let weiAmount = totalFee.plus(surveyImpl.gasReserve);

    //let estimatedGas = await this.engineContract.methods.addSurvey(newSurvey, questions, validators, hashes).estimateGas({ from: account, value: weiAmount, gas: 5000000 });
    // equivalent to the Web3 getData() function
    let data = this.engineContract.methods.addSurvey(newSurvey, questions, validators, hashes).encodeABI();
    let estimatedGas = await this.web3Service.estimateGas(account, this.engineContract._address, data, { gasPrice: gasPrice, value: weiAmount });
    let gasLimit = calcGasMargin(estimatedGas);
    
    const txHash = await new Promise<string>((resolve, reject) => {
      this.engineContract.methods.addSurvey(newSurvey, questions, validators, hashes).send({ from: account, value: weiAmount, gasPrice: gasPrice, gasLimit: gasLimit })
        .on('transactionHash', function (hash: string) {
          resolve(hash);
        })
        .on('error', function (error: any) {
          reject(error);
        });
    });

    return txHash;
  }

  async solveSurvey(surveyAddr: string) {
    this.checkContracts();
    let account = this.accountData.address;

    let gasPrice = await this.web3Service.getGasPrice();
    let data = this.engineContract.methods.solveSurvey(surveyAddr).encodeABI();
    let estimatedGas = await this.web3Service.estimateGas(account, this.engineContract._address, data, { gasPrice: gasPrice });
    let gasLimit = calcGasMargin(estimatedGas);
    let tx = await this.engineContract.methods.solveSurvey(surveyAddr).send({ from: account, gasPrice: gasPrice, gasLimit: gasLimit });
    
    return tx;
  }

  async increaseGasReserve(surveyAddr: string, weiAmount: BigNumber) {
    this.checkContracts();
    let account = this.accountData.address;

    let gasPrice = await this.web3Service.getGasPrice();
    let data = this.engineContract.methods.increaseGasReserve(surveyAddr).encodeABI();
    let estimatedGas = await this.web3Service.estimateGas(account, this.engineContract._address, data, { gasPrice: gasPrice, value: weiAmount });
    let gasLimit = calcGasMargin(estimatedGas);
    let tx = await this.engineContract.methods.increaseGasReserve(surveyAddr).send({ from: account, value: weiAmount, gasPrice: gasPrice, gasLimit: gasLimit });
    
    return tx;
  }

  async sendParticipation(surveyAddr: string, responses: string[], key: string) {
    this.checkContracts();
    let account = this.accountData.address;

    let gasPrice = await this.web3Service.getGasPrice();
    let data = this.engineContract.methods.addParticipation(surveyAddr, responses, key).encodeABI();
    let estimatedGas = await this.web3Service.estimateGas(account, this.engineContract._address, data, { gasPrice: gasPrice });
    let gasLimit = calcGasMargin(estimatedGas);

    const txHash = await new Promise<string>((resolve, reject) => {
      this.engineContract.methods.addParticipation(surveyAddr, responses, key).send({ from: account, gasPrice: gasPrice, gasLimit: gasLimit })
        .on('transactionHash', function (hash: string) {
          resolve(hash);
        })
        .on('error', function (error: any) {
          reject(error);
        });
    });

    return txHash;
  }

  async estimatePartFromForwarder(chainId: number, surveyAddr: string, responses: string[], key: string): Promise<FwdRequest> {
    const account = this.accountData.address;
    let result = await this.utilService.estimatePart(chainId, surveyAddr, responses, key);

    if (!result.success) {
      throw new Error(result.data);
    }

    const txGas = result.data;
    const nonce = await this.forwarderContract.methods.getNonce(account).call();
    const data = this.engineContract.methods.addParticipationFromForwarder(surveyAddr, responses, key, txGas).encodeABI();

    const request: FwdRequest = {
      from: account,
      to: this.engineContract._address,
      value: '0',
      gas: txGas,
      nonce: nonce,
      data: data
    };

    return Promise.resolve<FwdRequest>(request);
  }

  async sendPartFromForwarder(chainId: number, request: FwdRequest, signature: string) {
    let result = await this.utilService.sendPart(chainId, request, signature);

    if (!result.success) {
      throw new Error(result.data);
    }

    return result.data;
  }

  async findSurveys(chainId: number, filter: SurveyFilter): Promise<SurveySearchResult> {
    let result = await this.utilService.findSurveys(chainId, filter);

    if (!result.success) {
      throw new Error(result.data);
    }

    let total = result.data.total;
    let surveys = result.data.surveys;
    let impls: SurveyImpl[] = [];

    for(let survey of surveys) {
      let impl = await this.toSurveyImpl(survey, []);
      impls.push(impl);
    }

    return Promise.resolve<SurveySearchResult>({ total, surveys: impls });
  }

  async signTypedData(request: FwdRequest) {
    this.checkConnection();
    return new Promise<string>(async (resolve, reject) => {
      const typedData = await this.getMetaTxTypedData();
      const data = { ...typedData, message: request };
      const callback = (err, result) => {
        if (err) {
          return reject(err);
        }
        if (result.error) {
          return reject(result.error);
        }

        resolve(result.result);
      };

      if (this.web3.currentProvider.isMetaMask) {
        this.web3.currentProvider.sendAsync(
          {
            jsonrpc: "2.0",
            method: "eth_signTypedData_v4",
            params: [request.from, JSON.stringify(data)],
            id: new Date().getTime()
          },
          callback
        );
      } else {
        let send = this.web3.currentProvider.sendAsync;
        if (!send) send = this.web3.currentProvider.send;
        send.bind(this.web3.currentProvider)(
          {
            jsonrpc: "2.0",
            method: "eth_signTypedData",
            params: [request.from, data],
            id: new Date().getTime()
          },
          callback
        );
      }
    });
  }

  getState(surveyImpl: SurveyImpl): SurveyState {
    let currTime = this.web3Service.currenTime;
    
    if(currTime > surveyImpl.endDate.getTime()) {
      return SurveyState.CLOSED;
    }

    if(currTime < surveyImpl.startDate.getTime()) {
      return SurveyState.PENDING;
    }

    return SurveyState.OPENED;
  }

  async calcPartPrice() {
    let gasPrice = await this.web3Service.getGasPrice();
    return gasPrice.multipliedBy(this.avgTxGas);
  }

  private async loadChainData() {
    this._txGasWgtSamples = filterOutliers(await this.txGasSamples(100));

    if(this.txGasWgtSamples.length > 0) {
      const total = this.txGasWgtSamples.reduce((a, b) => a + b, 0);
      this._minTxGas = Math.min.apply(Math, this.txGasWgtSamples);
      this._avgTxGas = total / this.txGasWgtSamples.length;
    } else {
      this._avgTxGas = this._minTxGas = 3000000;// Default value for the first survey when there are no participations
    }
  }
  
  private async getMetaTxTypedData() {
    const chainId = await this.web3Service.getChainId();

    return {
      types: {
        EIP712Domain,
        ForwardRequest
      },
      domain: {
        name: 'INCForwarder',
        version: '0.0.1',
        chainId,
        verifyingContract: this.forwarderContract._address,
      },
      primaryType: 'ForwardRequest'
    }
  }
}
