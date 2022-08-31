import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError(error => {
      /*const message = error.error.message || error.statusText;
      return throwError(message);*/
      return this.handleError(error);
    }))
  }

  // Error handling 
  handleError(error: any) {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else if (error.status == 0) {
      // Server not avaliable
      errorMessage = `The server does not respond`;
    } else if (error.status == 503) {
      //hara user exception always 503
      errorMessage = error.error;
    } else {
      // Get server-side error
      errorMessage = error.message;
    }

    return throwError(errorMessage);
  }
}