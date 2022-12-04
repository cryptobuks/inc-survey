import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { isEmpty } from '../shared/helper';

const blockchainErrorRegex = /(?:.*execution reverted: )(?:[a-zA-z]+:\s*)?([^"]+)/gm;
const serverErrorRegex = /Relayer:\s*(.+)/g;
const toastDefaultLive = 10000;

@Injectable({
  providedIn: 'root'
})
export class MessageHelperService {

  constructor(
    private translateService: TranslateService,
    private messageService: MessageService
  ) { }

  showMessage(severity: string, detail: string, life: number) {
    this.messageService.add({
      sticky: true,
      severity,
      summary: this.translateService.instant(severity),
      detail,
      life
    });
  }

  showSuccess(detail: string, life = toastDefaultLive) {
    this.showMessage('success', detail, life);
  }

  showInfo(detail: string, life = toastDefaultLive) {
    this.showMessage('info', detail, life);
  }

  showWarn(detail: string, life = toastDefaultLive) {
    this.showMessage('warn', detail, life);
  }

  showError(detail: string, life = toastDefaultLive) {
    this.showMessage('error', detail, life);
  }

  getErrorDetails(error: any) {
    let details = error.message || error.error?.message;

    if (details) {
      let match = blockchainErrorRegex.exec(details);

      if (!match || !match[1]) {
        match = serverErrorRegex.exec(details);
      }

      if (match && match[1]) {
        details = match[1];
      }
    }

    return details;
  }

  showTxError(error: any) {
    //console.error(error);
    if (error.code === 4001) {
      // User rejected request
      return;
    }

    let errorMsg: string;

    if (error.status === 0 || error.status === 503) {
      // The server does not respond
      errorMsg = this.translateService.instant("server_in_maintenance");
    } else {
      let details = this.getErrorDetails(error);

      if (!isEmpty(details)) {
        errorMsg = this.translateService.instant("transaction_has_failed") + ':\n' + details;
      } else {
        errorMsg = this.translateService.instant("transaction_failed_try_again_later");
      }
    }

    this.showError(errorMsg);
  }

  showOptError(error: any) {
    //console.error(error);
    let errorMsg: string;

    if (error.status === 0 || error.status === 503) {
      // The server does not respond
      errorMsg = this.translateService.instant("server_in_maintenance");
    } else {
      let details = this.getErrorDetails(error);

      if (!isEmpty(details)) {
        errorMsg = this.translateService.instant("operation_has_failed") + ': ' + details;
      } else {
        errorMsg = this.translateService.instant("operation_failed_try_again_later");
      }
    }

    this.showError(errorMsg);
  }
}
