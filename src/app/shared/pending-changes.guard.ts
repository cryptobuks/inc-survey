import { CanDeactivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface ComponentCanDeactivate {
    canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable()
export class PendingChangesGuard implements CanDeactivate<ComponentCanDeactivate> {

    constructor(
        private translateService: TranslateService,
    ) { }

    canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
        // if there are no pending changes, just allow deactivation; else confirm first
        return component.canDeactivate() ?
            true :
            // NOTE: this warning message will only be shown when navigating elsewhere within your angular app;
            // when navigating away from your angular app, the browser will show a generic warning message
            // see http://stackoverflow.com/a/42207299/7307355
            // https://stackoverflow.com/questions/35922071/warn-user-of-unsaved-changes-before-leaving-page
            confirm(this.translateService.instant("warning_unsaved_changes"));
    }
}