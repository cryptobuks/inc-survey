import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

    constructor() { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        //var token = this.storageService.getToken();

        const newReq = /*token? */req.clone({
            //headers: req.headers.set('Authorization', token),
            withCredentials: true
        })/*: req*/;

        //console.debug("new headers", newReq.headers.keys());
        return next.handle(newReq);
    }
}