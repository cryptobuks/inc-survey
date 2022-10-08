import { Injectable, OnDestroy } from '@angular/core';
import BigNumber from 'bignumber.js';
import { QuestionImpl } from '../models/question-impl';
import { SurveyImpl } from '../models/survey-impl';
import { SurveyProps, EngineProps, Survey, Question, QuestionValidator, Participation, SurveyData, SurveyFilter } from '../models/survey-model';
import { RESPONSE_TYPE, SurveyState } from '../models/survey-support';
import { calcFeeTotal, calcGasMargin, filterOutliers } from '../shared/helper';
import { IpfsService } from './ipfs.service';
import { Web3Service } from './web3.service';
import { FwdRequest } from '../models/fwd-request';
import { AccountData } from '../models/account-data';
import { UtilService } from './util.service';
import { ListIterator } from '../models/list-iterator';
import { ListenerRemover } from '../shared/simple-listener';
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
  get engineContract(): any { return this.web3Service.engineContract; };
  get forwarderContract(): any { return this.web3Service.forwarderContract; };

  get surveyProps(): SurveyProps { return this.web3Service.surveyProps; };
  get engineProps(): EngineProps { return this.web3Service.engineProps; };

  get surveyCursor(): number { return this._surveyCursor; };
  get txGasWgtSamples(): number[] { return this._txGasWgtSamples; };
  get minTxGas(): number { return this._minTxGas; };
  get avgTxGas(): number { return this._avgTxGas; };

  private onChainLoadedRemover: ListenerRemover;
  private _surveyCursor: number;
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

  async currentCursor(surveyMaxDuration: number): Promise<number> {
    this.checkContracts();
    let cursor = await this.surveyContract.methods.currentCursor(surveyMaxDuration).call();
    return Promise.resolve<number>(cursor);
  }

  async txGasSamples(maxLength: number): Promise<number[]> {
    this.checkContracts();
    let samples = await this.surveyContract.methods.txGasSamples(maxLength).call();
    const arrOfNum = samples.map((str: string) => {
      return parseInt(str);
    });
    return Promise.resolve<number[]>(arrOfNum);
  }

  async remainingBudgetOf(surveyId: number): Promise<BigNumber> {
    this.checkContracts();
    let remainingBudget = await this.surveyContract.methods.remainingBudgetOf(surveyId).call();
    return Promise.resolve<BigNumber>(new BigNumber(remainingBudget));
  }

  async gasReserveOf(surveyId: number): Promise<BigNumber> {
    this.checkContracts();
    let gasReserve = await this.surveyContract.methods.gasReserveOf(surveyId).call();
    return Promise.resolve<BigNumber>(new BigNumber(gasReserve));
  }

  async keyRequiredOf(surveyId: number): Promise<boolean> {
    this.checkContracts();
    let keyRequired = await this.surveyContract.methods.keyRequiredOf(surveyId).call();
    return Promise.resolve<boolean>(keyRequired);
  }

  async ownerOf(surveyId: number): Promise<string> {
    this.checkContracts();
    let owner = await this.surveyContract.methods.ownerOf(surveyId).call();
    return Promise.resolve<string>(owner);
  }

  // No participants and no hashes
  async findSurveyData(surveyId: number): Promise<SurveyData> {
    this.checkContracts();
    let surveyData = await this.surveyContract.methods.findSurveyData(surveyId).call();
    return Promise.resolve<SurveyData>(surveyData);
  }

  // ### Surveys ###

  async getSurveysLength(): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getSurveysLength().call();
    return Promise.resolve<number>(parseInt(length));
  }

  async findSurvey(surveyId: number): Promise<SurveyImpl> {
    this.checkContracts();
    let survey = await this.surveyContract.methods.findSurvey(surveyId).call();
    let surveyData = await this.surveyContract.methods.findSurveyData(surveyId).call();
    let impl = SurveyImpl.toImpl(survey, surveyData, []);
    impl.imageData = await this.ipfsService.ipfsImage(survey.logoUrl);
    return Promise.resolve<SurveyImpl>(impl);
  }

  async getSurveys(cursor: number, length: number): Promise<SurveyImpl[]> {
    this.checkContracts();
    let surveys = await this.surveyContract.methods.getSurveys(cursor, length).call();
    let impls: SurveyImpl[] = [];

    for(let survey of surveys) {
      let surveyData = await this.surveyContract.methods.findSurveyData(survey.id).call();
      let impl = SurveyImpl.toImpl(survey, surveyData, []);
      impl.imageData = await this.ipfsService.ipfsImage(survey.logoUrl);
      impls.push(impl);
    }

    return Promise.resolve<SurveyImpl[]>(impls);
  }
  
  async findSurveys(cursor: number, length: number, filter: SurveyFilter): Promise<SurveyImpl[]> {
    this.checkContracts();
    let surveys = await this.surveyContract.methods.findSurveys(cursor, length, filter).call();
    let impls: SurveyImpl[] = [];

    for(let survey of surveys) {
      if(survey.id == 0) {
        continue;
      }

      let surveyData = await this.surveyContract.methods.findSurveyData(survey.id).call();
      let impl = SurveyImpl.toImpl(survey, surveyData, []);
      impl.imageData = await this.ipfsService.ipfsImage(survey.logoUrl);
      impls.push(impl);
    }

    return Promise.resolve<SurveyImpl[]>(impls);
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
      let surveyData = await this.surveyContract.methods.findSurveyData(survey.id).call();
      let impl = SurveyImpl.toImpl(survey, surveyData, []);
      impl.imageData = await this.ipfsService.ipfsImage(survey.logoUrl);
      impls.push(impl);
    }

    return Promise.resolve<SurveyImpl[]>(impls);
  }

  async findOwnSurveys(cursor: number, length: number, filter: SurveyFilter): Promise<SurveyImpl[]> {
    this.checkContracts();
    let surveys = await this.surveyContract.methods.findOwnSurveys(cursor, length, filter).call({ from : this.accountData.address });
    let impls: SurveyImpl[] = [];

    for(let survey of surveys) {
      if(survey.id == 0) {
        continue;
      }

      let surveyData = await this.surveyContract.methods.findSurveyData(survey.id).call();
      let impl = SurveyImpl.toImpl(survey, surveyData, []);
      impl.imageData = await this.ipfsService.ipfsImage(survey.logoUrl);
      impls.push(impl);
    }

    return Promise.resolve<SurveyImpl[]>(impls);
  }

  // ### Participants ###

  async getParticipantsLength(surveyId: number): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getParticipantsLength(surveyId).call();
    return Promise.resolve<number>(parseInt(length));
  }

  async getParticipant(surveyId: number, index: number): Promise<string> {
    let accounts = await this.getParticipants(surveyId, index, 1);
    return accounts[0];
  }

  async getParticipants(surveyId: number, cursor: number, length: number): Promise<string[]> {
    this.checkContracts();
    let accounts = await this.surveyContract.methods.getParticipants(surveyId, cursor, length).call();
    return Promise.resolve<string[]>(accounts);
  }

  async isParticipant(surveyId: number, account: string): Promise<boolean> {
    this.checkContracts();
    let alreadyParticipated = await this.surveyContract.methods.isParticipant(surveyId, account).call();
    return Promise.resolve<boolean>(alreadyParticipated);
  }

  async isUserParticipant(surveyId: number): Promise<boolean> {
    return this.isParticipant(surveyId, this.accountData.address);
  }

  // ### Participations ###

  async getParticipation(surveyId: number, index: number): Promise<Participation> {
    let parts = await this.getParticipations(surveyId, index, 1);
    return parts[0];
  }

  async getParticipations(surveyId: number, cursor: number, length: number): Promise<Participation[]> {
    this.checkContracts();
    let parts = await this.surveyContract.methods.getParticipations(surveyId, cursor, length).call();
    return Promise.resolve<Participation[]>(parts);
  }

  async findParticipation(surveyId: number, account: string): Promise<Participation> {
    this.checkContracts();
    let part = await this.surveyContract.methods.findParticipation(surveyId, account).call();
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

  async findOwnParticipation(surveyId: number): Promise<Participation> {
    this.checkContracts();
    let part = await this.surveyContract.methods.findOwnParticipation(surveyId).call({ from : this.accountData.address });
    return Promise.resolve<Participation>(part);
  }

  // ### Questions ###

  async getQuestionsLength(surveyId: number): Promise<number> {
    this.checkContracts();
    let length = await this.surveyContract.methods.getQuestionsLength(surveyId).call();
    return Promise.resolve<number>(parseInt(length));
  }

  async getQuestion(surveyId: number, index: number): Promise<QuestionImpl> {
    let questions = await this.getQuestions(surveyId, index, 1);
    return questions[0];
  }

  async getQuestions(surveyId: number, cursor: number, length: number): Promise<QuestionImpl[]> {
    this.checkContracts();
    let questions = await this.surveyContract.methods.getQuestions(surveyId, cursor, length).call();
    let impls: QuestionImpl[] = [];

    for(let question of questions) {
      impls.push(QuestionImpl.toImpl(question, []));
    }

    return Promise.resolve<QuestionImpl[]>(impls);
  }

  // ### Responses ###
  async getResponses(surveyId: number, questionIndex: number, cursor: number, length: number): Promise<string[]> {
    this.checkContracts();
    let responses = await this.surveyContract.methods.getResponses(surveyId, questionIndex, cursor, length).call();
    return Promise.resolve<string[]>(responses);
  }

  getResponseIterator(surveyId: number, questionIndex: number, totalLength: number): ListIterator<string[]> {
    this.checkContracts();

    const iterator: ListIterator<string[]> = {
      cursor: 0,
      hasNext: function (): boolean {
        return iterator.cursor < totalLength;
      }.bind(this),
      next: async function () {
        let length = this.surveyProps.responseMaxPerRequest;
        if (iterator.cursor + length > totalLength) {
          length = totalLength - iterator.cursor;
        }
        let responses = await this.getResponses(surveyId, questionIndex, iterator.cursor, length);
        iterator.cursor += length;
        return responses;
      }.bind(this)
    };

    return iterator;
  }

  // ### Validator functions ###

  async getValidators(surveyId: number, questionIndex: number): Promise<QuestionValidator[]> {
    this.checkContracts();
    let validators = await this.surveyContract.methods.getValidators(surveyId, questionIndex).call();
    return Promise.resolve<QuestionValidator[]>(validators);
  }

  // ### Engine functions ###

  async sendSurvey(surveyImpl: SurveyImpl) {
    this.checkContracts();
    let account = this.accountData.address;
    let newSurvey: Survey = {
      id: 0,
      entryTime: 0,
      title: surveyImpl.title,
      description: surveyImpl.description?? '',
      logoUrl: surveyImpl.logoUrl?? '',
      startTime: Math.round(surveyImpl.startDate.getTime() / 1000),
      endTime: Math.round(surveyImpl.endDate.getTime() / 1000),
      budget: surveyImpl.budget.toFixed(0),
      reward: surveyImpl.reward.toFixed(0)
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
    let totalFee = calcFeeTotal(surveyImpl.budget, surveyImpl.reward, this.engineProps.feeWei);
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

  async solveSurvey(surveyId: number) {
    this.checkContracts();
    let account = this.accountData.address;

    let gasPrice = await this.web3Service.getGasPrice();
    let data = this.engineContract.methods.solveSurvey(surveyId).encodeABI();
    let estimatedGas = await this.web3Service.estimateGas(account, this.engineContract._address, data, { gasPrice: gasPrice });
    let gasLimit = calcGasMargin(estimatedGas);
    let tx = await this.engineContract.methods.solveSurvey(surveyId).send({ from: account, gasPrice: gasPrice, gasLimit: gasLimit });
    
    return tx;
  }

  async increaseGasReserve(surveyId: number, weiAmount: BigNumber) {
    this.checkContracts();
    let account = this.accountData.address;

    let gasPrice = await this.web3Service.getGasPrice();
    let data = this.engineContract.methods.increaseGasReserve(surveyId).encodeABI();
    let estimatedGas = await this.web3Service.estimateGas(account, this.engineContract._address, data, { gasPrice: gasPrice, value: weiAmount });
    let gasLimit = calcGasMargin(estimatedGas);
    let tx = await this.engineContract.methods.increaseGasReserve(surveyId).send({ from: account, value: weiAmount, gasPrice: gasPrice, gasLimit: gasLimit });
    
    return tx;
  }

  async sendParticipation(surveyId: number, responses: string[], key: string) {
    this.checkContracts();
    let account = this.accountData.address;

    let gasPrice = await this.web3Service.getGasPrice();
    let data = this.engineContract.methods.addParticipation(surveyId, responses, key).encodeABI();
    let estimatedGas = await this.web3Service.estimateGas(account, this.engineContract._address, data, { gasPrice: gasPrice });
    let gasLimit = calcGasMargin(estimatedGas);

    const txHash = await new Promise<string>((resolve, reject) => {
      this.engineContract.methods.addParticipation(surveyId, responses, key).send({ from: account, gasPrice: gasPrice, gasLimit: gasLimit })
        .on('transactionHash', function (hash: string) {
          resolve(hash);
        })
        .on('error', function (error: any) {
          reject(error);
        });
    });

    return txHash;
  }

  async estimatePartFromForwarder(chainId: number, surveyId: number, responses: string[], key: string): Promise<FwdRequest> {
    const account = this.accountData.address;
    let result = await this.utilService.estimatePart(chainId, surveyId, responses, key);

    if (!result.success) {
      throw new Error(result.data);
    }

    const txGas = result.data;
    const nonce = await this.forwarderContract.methods.getNonce(account).call();
    const data = this.engineContract.methods.addParticipationFromForwarder(surveyId, responses, key, txGas).encodeABI();

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
    this.checkConnection();
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
    this._surveyCursor = await this.currentCursor(this.engineProps.rangeMaxTime); 
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
