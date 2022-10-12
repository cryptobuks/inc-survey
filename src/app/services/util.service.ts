import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { retry } from "rxjs/operators";
import { FwdRequest } from "../models/fwd-request";
import { FwdResponse } from "../models/fwd-response";
import { NotificationType } from "../models/notification-type";
import { RELAYER_API_URL, COINGECKO_PRICE_URL, HTTP_OPTIONS, RECAPTCHA_RENDER } from "../shared/constants";
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

    async estimatePart(chainId: number, surveyId: number, responses: string[], key: string): Promise<FwdResponse> {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<FwdResponse>(RELAYER_API_URL + '/estimate-part', {
            chainId,
            surveyId,
            responses,
            key,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async sendPart(chainId: number, request: FwdRequest, signature: string): Promise<FwdResponse> {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<FwdResponse>(RELAYER_API_URL + '/send-part', {
            chainId,
            request,
            signature,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async getHash(messageId: string): Promise<FwdResponse> {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<FwdResponse>(RELAYER_API_URL + '/part-hash', {
            messageId,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async subscribeToNotifications(subscription: PushSubscription, prefs: any) {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<FwdResponse>(RELAYER_API_URL + '/subscribe-notif', {
            subscription,
            prefs,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    }

    async triggerNotification(type: NotificationType, data: any) {
        const recaptcha = await grecaptcha.execute(RECAPTCHA_RENDER, { action: 'submit' });
        return this.http.post<FwdResponse>(RELAYER_API_URL + '/trigger-notif', {
            type,
            data,
            recaptcha
        }, HTTP_OPTIONS).toPromise();
    } 

    async request(method: string, url: string, timeout?: number): Promise<XMLHttpRequest> {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open(method, url, true);

            if(timeout) {
                xhr.timeout = 3000; // tiempo en milisegundos
            }

            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };

            xhr.onerror = function () {
                reject({
                    status: this.status,
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