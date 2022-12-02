import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { retry } from "rxjs/operators";
import { FwdRequest } from "../models/fwd-request";
import { RelResponse } from "../models/rel-response";
import { NotifType } from "../models/notif-type";
import { RELAYER_API_URL, COINGECKO_PRICE_URL, HTTP_OPTIONS, RECAPTCHA_RENDER } from "../shared/constants";
import { SurveyFilter } from "../models/survey-filter";
declare var grecaptcha: any;

@Injectable({
    providedIn: 'root'
})
export class UtilService {

    constructor(private http: HttpClient) {
    }

    async loadJson(url: string): Promise<any> {
        return await this.http.get<any>(url)
        .pipe(
            retry(1)
        ).toPromise();
    }

    async getCurrencyPrice(symbol: string): Promise<number> {
        let currencyId: string;
        if(symbol == 'ETH') {
            currencyId = 'ethereum';
        } else if(symbol == 'AVAX') {
            currencyId = 'avalanche-2';
        } else if(symbol == 'MATIC') {
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

            if(timeout) {
                xhr.timeout = timeout; // Time in milliseconds
            }

            xhr.onload = function () {
                // Request finished
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            };

            xhr.ontimeout = (e) => {
                // XMLHttpRequest timed out
                xhr.abort();
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            };

            xhr.onerror = function () {
                // An error has occurred
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            };

            xhr.send();
        });
    }

    private async loadCurrencyData(currencyId: string): Promise<any> {
        let data = await this.http.get<any>(COINGECKO_PRICE_URL + currencyId)
            .pipe(
                retry(1)
            ).toPromise();
        return Promise.resolve<number>(data[0]);
    }
}