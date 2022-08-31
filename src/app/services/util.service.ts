import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { retry } from "rxjs/operators";
import { FwdRequest } from "../models/fwd-request";
import { FwdResponse } from "../models/fwd-response";
import { RELAYER_API_URL, COINGECKO_PRICE_URL, HTTP_OPTIONS } from "../shared/constants";
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

    async getCaptchaUrl(chainId: number): Promise<string> {
        let recaptcha = await grecaptcha.execute('6LfrfcQdAAAAAFqwpMDyFMDLJn2HU3zWQqwgnu1E', { action: 'submit' });
        return RELAYER_API_URL[chainId] + '/captcha/' + recaptcha;
    }

    async estimatePart(chainId: number, surveyId: number, responses: string[], key: string, captcha: string): Promise<FwdResponse> {
        return this.http.post<FwdResponse>(RELAYER_API_URL[chainId] + '/estimate-part', {
            chainId,
            surveyId,
            responses,
            key,
            captcha
        }, HTTP_OPTIONS).toPromise();
    }

    async sendPart(chainId: number, request: FwdRequest, signature: string, captcha: string): Promise<FwdResponse> {
        return this.http.post<FwdResponse>(RELAYER_API_URL[chainId] + '/send-part', {
            chainId,
            request,
            signature,
            captcha
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