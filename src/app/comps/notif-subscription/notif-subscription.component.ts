import { Component, OnInit } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { NotifPrefs } from 'src/app/models/notif-prefs';
import { MessageHelperService } from 'src/app/services/message-helper.service';
import { UtilService } from 'src/app/services/util.service';
import { Web3Utils } from 'src/app/shared/constants';
import { cloneDeep, getUniqueItemsIgnoreCase, shortAddress } from 'src/app/shared/helper';
import { environment } from 'src/environments/environment';

const VAPID_PUBLIC_KEY = environment.production? 
"BPI6xpqKCj97BMDrKuXz6Q_E4yMjBKhEeiiK4rVpD21xFCqko3Xath-hRejcoWF86RHkWzGAU9r_qtdQafOLPtQ": 
"BG73DNPCLA6h3awHy1unNvVtbAZVi2dPqMdRlQ0taHaZbCd7_f0am_XYhgF7X89gVkx4agwmlyQsvcuY6dwlt5E";

@Component({
  selector: 'notif-subscription',
  templateUrl: './notif-subscription.component.html',
  styleUrls: ['./notif-subscription.component.css']
})
export class NotifSubscriptionComponent implements OnInit {

  swEnabled: boolean;
  permissionGranted: boolean;
  displayPrefsDialog = false;

  subscription: PushSubscription;
  prefs: NotifPrefs = {};
  prefsClone: NotifPrefs;

  constructor(
    private utilService: UtilService,
    private messageHelperService: MessageHelperService,
    private swPush: SwPush
  ) { }

  ngOnInit(): void {
    this.swEnabled = this.swPush.isEnabled;
    if(!this.swEnabled) {
      return;
    }
    
    navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
      console.log(`notification permission status is ${permissionStatus.state}`);
      this.permissionGranted = permissionStatus.state == 'granted';
      permissionStatus.onchange = () => {
        console.log(`notification permission status has changed to ${permissionStatus.state}`);
        this.permissionGranted = permissionStatus.state == 'granted';
      };
    });

    // Emits PushSubscription or null if there is no subscription.
    this.swPush.subscription.subscribe((value: PushSubscription) => {
      if(this.subscription === undefined && value) {
        this.loadPrefs(value.endpoint);
      }

      this.subscription = value;
      if(!this.subscription) {
        this.prefs = {};
        this.prefsClone = undefined;
      }
    });
  }

  ngAfterViewInit() {
  }

  onInputOwners(event: KeyboardEvent) {
    return !this.prefs.fromOwners || this.prefs.fromOwners.length < 10;
  }

  onInputKeywords(event: KeyboardEvent) {
    return !this.prefs.keywords || this.prefs.keywords.length < 10;
  }

  onChangeOwners(event: string[]) {
    if(event && event.length > 0) {
      const i = event.length - 1;
      event[i] = event[i].trim();
      if(!Web3Utils.isAddress(event[i])) {
        event.pop();
      }
    }

    this.prefs.fromOwners = getUniqueItemsIgnoreCase(event);
  }

  onChangeKeywords(event: string[]) {
    if(event && event.length > 0) {
      const i = event.length - 1;
      event[i] = event[i].replace(/[^a-z0-9\-\s]/gi, "").substring(0, 48).trim();
    }
    
    this.prefs.keywords = getUniqueItemsIgnoreCase(event);
  }

  shortAddress(address: string) {
    return shortAddress(address);
  }

  isPrefsChanged() {
    return (this.prefsClone.withoutKey || false) != (this.prefs.withoutKey || false) ||
    this.prefsClone.minReward != this.prefs.minReward ||
    JSON.stringify(this.prefsClone.fromOwners || []) != JSON.stringify(this.prefs.fromOwners || []) ||
    JSON.stringify(this.prefsClone.keywords || []) != JSON.stringify(this.prefs.keywords || []);
  }

  editPrefs() {
    if(!this.prefsClone) {
      this.prefsClone = cloneDeep(this.prefs);
    }
    this.displayPrefsDialog = true;
  }

  async subscribe() {
    let response: PushSubscription;
    try {
      // Emits SwPush.subscription
      response = await this.swPush.requestSubscription({
        serverPublicKey: VAPID_PUBLIC_KEY
      });

      if(!response) {
        throw new Error("Unable to get subscription");
      }
    } catch (error) {
      // Registration failed - permission denied
      console.error(error);
      return;
    }

    this.subscription = response;// This shouldn't be necessary
    const result = await this.utilService.subscribeToNotifications(this.subscription, this.prefs);

    if (result.success) {
      this.editPrefs();
    } else {
      this.messageHelperService.showOptError(new Error(result.data));
    }
  }

  async saveSubscription() {
    this.displayPrefsDialog = false;
    const result = await this.utilService.subscribeToNotifications(this.subscription, this.prefs);

    if(result.success) {
      this.prefsClone = undefined;
    } else {
      this.messageHelperService.showOptError(new Error(result.data));
    }
  }

  private async loadPrefs(endpoint: string) {
    const result = await this.utilService.getNotificationPrefs(endpoint);

    if(result.success) {
      this.prefs = JSON.parse(result.data);
    } else {
      this.messageHelperService.showOptError(new Error(result.data));
    }
  }
}
