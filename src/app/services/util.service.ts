import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { retry } from "rxjs/operators";
import { FwdRequest } from "../models/fwd-request";
import { RelResponse } from "../models/rel-response";
import { NotifType } from "../models/notif-type";
import { RELAYER_API_URL, COINGECKO_PRICE_URL, HTTP_OPTIONS, RECAPTCHA_RENDER, INC_TOKEN, CURRENT_CHAIN } from "../shared/constants";
import { SurveyFilter } from "../models/survey-filter";
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { schema, TokenList } from '@uniswap/token-lists';
import { StorageUtil } from "../shared/storage-util";
import { DEFAULT_ACTIVE_LIST_URLS, UNSUPPORTED_LIST_URLS } from "../shared/token-lists";
import { ChainId } from "../models/chains";
import { cloneDeep, getTokenLogoURL, ipfsToURL } from "../shared/helper";
import { newTokenFromInfo, TokenData } from "../models/token-data";
declare var grecaptcha: any;

@Injectable({
    providedIn: 'root'
})
export class UtilService {

    private trustTokens: { [chainId: string]: { [address: string]: TokenData } } = {};
    private tokenLogoUrls: { [chainId: string]: { [address: string]: string } } = {};

    validate: ValidateFunction;

    constructor(private http: HttpClient) {
        const ajv = new Ajv({ allErrors: true });
        addFormats(ajv);
        this.validate = ajv.compile(schema);
        this.loadTokens();
    }

    async loadJson(url: string): Promise<any> {
        return await this.http.get<any>(url)
            .pipe(
                retry(1)
            ).toPromise();
    }

    async getCurrencyPrice(symbol: string): Promise<number> {
        let currencyId: string;
        if (symbol == 'ETH') {
            currencyId = 'ethereum';
        } else if (symbol == 'AVAX') {
            currencyId = 'avalanche-2';
        } else if (symbol == 'MATIC') {
            currencyId = 'matic-network';
        } else {
            throw new Error('Unk. currency: ' + symbol);
        }

        let data = await this.loadCurrencyData(currencyId);
        return Promise.resolve<number>(data?.current_price);
    }

    async estimatePart(chainId: number, surveyAddr: string, responses: string[], key: string): Promise<RelResponse> {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<RelResponse>(RELAYER_API_URL + '/estimate-part', {
            chainId,
            surveyAddr,
            responses,
            key,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async sendPart(chainId: number, request: FwdRequest, signature: string): Promise<RelResponse> {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<RelResponse>(RELAYER_API_URL + '/send-part', {
            chainId,
            request,
            signature,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async getHash(messageId: string): Promise<RelResponse> {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<RelResponse>(RELAYER_API_URL + '/part-hash', {
            messageId,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async subscribeToNotifications(subscription: PushSubscription, prefs: any) {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<RelResponse>(RELAYER_API_URL + '/subscribe-notif', {
            subscription,
            prefs,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async getNotificationPrefs(endpoint: string) {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<RelResponse>(RELAYER_API_URL + '/notif-prefs', {
            endpoint,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async triggerNotification(type: NotifType, data: any) {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<RelResponse>(RELAYER_API_URL + '/trigger-notif', {
            type,
            data,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async findSurveys(chainId: number, filter: SurveyFilter): Promise<RelResponse> {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<RelResponse>(RELAYER_API_URL + '/find-surveys', {
            chainId,
            filter,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async request(method: string, url: string, timeout?: number): Promise<XMLHttpRequest> {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open(method, url, true);

            if (timeout) {
                xhr.timeout = timeout; // Time in milliseconds
            }

            xhr.onload = function () {
                // Request finished
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    reject(new Error(`${method.toUpperCase()} ${url}: ${xhr.status} ${xhr.statusText}`));
                }
            };

            xhr.ontimeout = (e) => {
                // XMLHttpRequest timed out
                xhr.abort();
                reject(new Error(`${method.toUpperCase()} ${url}: timed out`));
            };

            xhr.onerror = function (e) {
                // An error has occurred
                reject(new Error(`${method.toUpperCase()} ${url}: ${xhr.status} ${xhr.statusText}`));
            };

            xhr.send();
        });
    }

    retrieveTrustToken(chainId: ChainId, address: string, logoURI: string = undefined): TokenData | undefined {
        return this.trustTokens[chainId] ? this.trustTokens[chainId][address] : undefined;
    }

    retrieveTokenLogoURL(chainId: ChainId, address: string, logoURI: string = undefined): string | undefined {
        let logoUrl = this.tokenLogoUrls[chainId] ? this.tokenLogoUrls[chainId][address] : undefined;

        if (!logoUrl) {
            logoUrl = getTokenLogoURL(chainId, address);
        }

        return logoUrl;
    }

    private async loadCurrencyData(currencyId: string): Promise<any> {
        let data = await this.http.get<any>(COINGECKO_PRICE_URL + currencyId)
            .pipe(
                retry(1)
            ).toPromise();
        return Promise.resolve<number>(data[0]);
    }

    private async loadTokens() {
        let listUrls = DEFAULT_ACTIVE_LIST_URLS.concat(StorageUtil.activeLists);
        listUrls = listUrls.filter((url, pos) => listUrls.indexOf(url) === pos && !UNSUPPORTED_LIST_URLS.includes(url));
        const tokens: { [chainId: string]: { [address: string]: TokenData } } = {};
        const logoUrls: { [chainId: string]: { [address: string]: string } } = {};

        // add INC token
        let incToken = cloneDeep(INC_TOKEN[CURRENT_CHAIN]);
        tokens[CURRENT_CHAIN] = {};
        tokens[CURRENT_CHAIN][incToken.address] = incToken;

        for (const listUrl of listUrls) {
            let list: TokenList = await this.loadJson(listUrl);
            if (!this.validate(list) || !list?.tokens) {
                continue;
            }

            for (const tokenInfo of list.tokens) {
                if (!tokens[tokenInfo.chainId]) {
                    tokens[tokenInfo.chainId] = {};
                }

                if (!logoUrls[tokenInfo.chainId]) {
                    logoUrls[tokenInfo.chainId] = {};
                }

                tokenInfo.logoURI = tokenInfo.logoURI ? ipfsToURL(tokenInfo.logoURI) : getTokenLogoURL(tokenInfo.chainId, tokenInfo.address);

                if (DEFAULT_ACTIVE_LIST_URLS.includes(listUrl)) {
                    tokens[tokenInfo.chainId][tokenInfo.address] = newTokenFromInfo(tokenInfo);
                }

                logoUrls[tokenInfo.chainId][tokenInfo.address] = tokenInfo.logoURI;
            }
        }

        this.trustTokens = tokens;
        this.tokenLogoUrls = logoUrls;
    }
}