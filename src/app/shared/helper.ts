import { AppModule } from "../app.module";
import { GenericDialogComponent } from "../comps/generic-dialog/generic-dialog.component";
import { AbstractType, ElementRef, InjectFlags, InjectionToken, Type } from "@angular/core";
import BigNumber from "bignumber.js";
import { PaginatorData } from "../models/paginator-data";
import { ChainId } from "../models/chains";
import { INC_LOGO_URL, INC_TOKEN } from "./constants";
declare var Web3: any;
declare var $: any;
declare const XLSX: any;
declare var charts: any;
var uniqueTimeout;

const ENS_NAME_REGEX = /^(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+)eth(\/.*)?$/

export function getInstance<T>(token: Type<T> | AbstractType<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T {
  return AppModule.injector.get(token, notFoundValue, flags);
}

export function keccak256(data: string) {
  return Web3.utils.keccak256(data);
}

export function toChecksumAddress(data: string) {
  return Web3.utils.toChecksumAddress(data);
}

export function isEmpty(value: string) {
  return !value || value.trim().length == 0;
}

export function isBlank(value: string) {
  return !value || value.length == 0;
}

export function isDigit(value: string) {
  return value && /^-?\d+$/.test(value);
}

export function isUDigit(value: string) {
  return value && /^\d+$/.test(value);
}

export function containsDigits(str: string) {
  return /\d/.test(str);
}

export function isUUID(uuid: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
}

export function getUserLocale(defaultValue: string): string {
  if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
    return defaultValue;
  }
  const wn = window.navigator as any;
  let lang = wn.languages ? wn.languages[0] : defaultValue;
  lang = lang || wn.language || wn.browserLanguage || wn.userLanguage;
  return lang;
}

export function messageDialog(title: string, content: string, type: string | null = null) {
  AppModule.dialog.open(GenericDialogComponent, {
    data: {
      type: type,
      title: title,
      content: content
    }
  });
}

export function infoDialog(title: string, content: string) {
  messageDialog(title, content, 'info');
}

export function warnDialog(title: string, content: string) {
  messageDialog(title, content, 'warn');
}

export function errorDialog(title: string, content: string) {
  messageDialog(title, content, 'error');
}

export function confirmDialog(title: string, content: string, onAccept: () => any, onCancel?: () => any) {
  AppModule.dialog.open(GenericDialogComponent, {
    data: {
      type: 'confirm',
      title: title,
      content: content,
      onAccept: onAccept,
      onCancel: onCancel
    }
  });
}

export function inputDialog(title: string, message: string, label: string, onAccept: (value: string) => any, onCancel?: () => any) {
  AppModule.dialog.open(GenericDialogComponent, {
    data: {
      type: 'input',
      title: title,
      message: message,
      label: label,
      onAccept: onAccept,
      onCancel: onCancel
    }
  });
}

/*export function messageToast(icon: string, message: string, panelClass: string | undefined = undefined) {
  AppModule.snackBar.openFromComponent(GenericSnackBarComponent, {
    data: {
      icon: icon,
      message: message
    },
    duration: 5 * 1000,
    verticalPosition: 'top',
    panelClass: panelClass
  });
}

export function okayToast(message: string) {
  messageToast('check_circle', message, 'alert-info');
}

export function infoToast(message: string) {
  messageToast('info', message, 'alert-info');
}

export function warnToast(message: string) {
  messageToast('info', message, 'alert-warn');
}

export function errorToast(message: string) {
  messageToast('info', message, 'alert-error');
}*/

export function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

export const isNum = (val: string): boolean => {
  return !isNaN(Number(val));
}

export function isNumIn(num: number, ...vals: number[]) {

  for (let i = 0; i < vals.length; i++) {
    if(vals[i] == num) {
      return true;
    }
  }

  return false;
}

export function format(str: string, ...vals: string[]) {

  for (let i = 0; i < vals.length; i++) {
    str = str.replace("{" + i + "}", vals[i]);
  }

  return str;
}

export function cloneDeep<Type>(obj: Type): Type {
  return JSON.parse(JSON.stringify(obj));
}

export function joinWords(words: string[], max: number, separator?: string): string {
  let str = words.slice(0, max).join(separator);

  if (words.length > max) {
    str += ", ...";
  }

  return str;
}

export function equalsIgnoreCase(str1: string, str2: string): boolean {
  return str1?.toLowerCase() === str2?.toLowerCase();
}

export const indexOfIgnoreCase = (array: any[], val: any): number => {
  return array.findIndex(item => equalsIgnoreCase(item, val));
}

export const containsIgnoreCase = (array: any[], val: any): boolean => {
  return indexOfIgnoreCase(array, val) >= 0;
}

export function getUniqueItemsIgnoreCase(items: string[]) {
  const dest = [];
  for(let item of items) {
    if(!dest.some(it => equalsIgnoreCase(it, item))) {
      dest.push(item);
    }
  }

  return dest;
}

// min and max included 
export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomInt() {
  return randomIntFromInterval(1, Number.MAX_SAFE_INTEGER);
}

export function uniqueId(): string {
  return new Date().getTime() + "-" + randomIntFromInterval(1000, Number.MAX_SAFE_INTEGER);
}

export function degreesToRadians(degrees: number): number {
  const pi = Math.PI;
  return degrees * (pi / 180);
}

// unsafe:ipfs://QmWzL3TSmkMhbqGBEwyeFyWVvLmEo3F44HBMFnmTUiTfp1
// ipfs://QmWzL3TSmkMhbqGBEwyeFyWVvLmEo3F44HBMFnmTUiTfp1
// To
// https://ipfs.io/ipfs/QmWzL3TSmkMhbqGBEwyeFyWVvLmEo3F44HBMFnmTUiTfp1
export function ipfsToURL(ipfs: string) {
  return ipfs.replace(/(unsafe:)?ipfs:\/\//gi, "https://ipfs.io/ipfs/");
}

export function isIpfsUri(uri: string): boolean {
  return uri && /^ipfs:\/\/[0-9a-zA-Z]{46,59}$/.test(uri);
}

export function uriToHttp(uri: string): string[] {
  const protocol = uri? uri.split(':')[0].toLowerCase(): undefined;

  switch (protocol) {
    case 'https':
      return [uri];
    case 'http':
      return ['https' + uri.substr(4), uri];
    case 'ipfs':
      const hash = uri.match(/^ipfs:(\/\/)?(.*)$/i)?.[2];
      return [`https://cloudflare-ipfs.com/ipfs/${hash}`, `https://ipfs.io/ipfs/${hash}`];
    case 'ipns':
      const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2];
      return [`https://cloudflare-ipfs.com/ipns/${name}`, `https://ipfs.io/ipns/${name}`];
    default:
      return [];
  }
}

export function parseENSAddress(ensAddress: string): { ensName: string; ensPath: string | undefined } | undefined {
  const match = ensAddress.match(ENS_NAME_REGEX);
  if (!match) return undefined;
  return { ensName: `${match[1].toLowerCase()}eth`, ensPath: match[4] }
}

function chainIdToNetworkName(networkId: ChainId): string {
  switch (networkId) {
    case ChainId.MAINNET:
      return 'ethereum';
    case ChainId.MATIC:
      return 'polygon';
    default:
      return 'ethereum';
  }
}

export const getTokenLogoURL = (
  address: string,
  chainId: ChainId
): string | undefined => {
  if(equalsIgnoreCase(INC_TOKEN[chainId].address, address)) {
    return INC_LOGO_URL;
  }

  const networkName = chainIdToNetworkName(chainId);
  if (networkName) {
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${networkName}/assets/${address}/logo.png`;
  }

  return undefined;
}

/*export const toUnits = (value: string | number | bigint, decimals: number) => {
  return Web3Utils.toWei(value.toString(), findUnit(decimals));
};

export const toAmount = (value: number | string | bigint, decimals: number) => {
  return Web3Utils.fromWei(value.toString(), findUnit(decimals));
};

const findUnit = (decimals: number) => {
  let value = '1';
  for(let i = 0; i < decimals; i++) {
    value += '0';
  }

  return Object.keys(Web3Utils.unitMap).find(key => Web3Utils.unitMap[key] === value);
};*/
export const toUnits = (value: number | string | BigNumber, decimals: number = 18) => {
  let bn: BigNumber = BigNumber.isBigNumber(value)? value: new BigNumber(value);
  let p = new BigNumber(10).pow(new BigNumber(decimals));
  return bn.multipliedBy(p);
};

export const toAmount = (value: number | string | BigNumber, decimals: number = 18) => {
  let bn: BigNumber = BigNumber.isBigNumber(value)? value: new BigNumber(value);
  let p = new BigNumber(10).pow(new BigNumber(decimals));
  return bn.dividedBy(p);
};

export function removeTrailingZeros(value: number | string) {
  if (!value) return '';

  let str = value.toString();
  let pointIndex = str.indexOf(".");

  if(pointIndex != -1) {
    while(str.length > pointIndex && (str[str.length - 1] == '0' || str[str.length - 1] == '.')) {
      str = str.substring(0, str.length - 1);
    }
  }

  return str;
}

export const toFixedBigNumber = (value: BigNumber, decimalPlaces: number = 18) => {
  return removeTrailingZeros(value?.toFixed(decimalPlaces));
};

export const toFormatBigNumber = (value: BigNumber, decimalPlaces: number = 6) => {
  return removeTrailingZeros(value?.toFormat(decimalPlaces));
};

export function calcGasMargin(value: BigNumber.Value, percent = 20) {
  let bn = BigNumber.isBigNumber(value) ? value : new BigNumber(value);
  return bn.multipliedBy(100 + percent).dividedBy(100).toFixed(0);
}

export function calcFeeTotal(budget: BigNumber, reward: BigNumber, feeWei: BigNumber) {
  let partsNum = budget.dividedBy(reward);
  return partsNum.multipliedBy(feeWei);
}

export function calcGasReserve(budget: BigNumber, reward: BigNumber, partPrice: BigNumber, margin?: number) {
  if(!budget || budget.isNaN() || !reward || reward.isNaN() || !partPrice || partPrice.isNaN()) {
    return new BigNumber(0);
  }

  if(!budget.isGreaterThan(0) || !reward.isGreaterThan(0) || budget.isLessThan(reward) || !partPrice.isGreaterThan(0)) {
    return new BigNumber(0);
  }

  let partsNum = budget.dividedBy(reward).integerValue(BigNumber.ROUND_CEIL);
  let minReserve = partPrice.multipliedBy(partsNum);
  return new BigNumber(calcGasMargin(minReserve, margin));
}

export const truncateSeconds = (date: Date) => {
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

/**
* Resize a base 64 Image
*/
export function resizeBase64Image(base64: string, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve) => {
    let img = new Image();
    img.src = base64;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }

      let canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL());
    };
  })
}

/**
 * Base64 length calculation
 */
export function lengthBase64(base64: string) {
    if (isEmpty(base64)) return 0;

    let characterCount = base64.length;
    let lastChars = base64.substring(characterCount - 2, 2);
    let paddingCount = (lastChars.match(/=/g) || []).length;
    return (3 * Math.ceil(characterCount / 4)) - paddingCount;
}

export function isValidHttpUrl(spec: string) {
  let url: URL;
  
  try {
    url = new URL(spec);
  } catch (err) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

// using HEAD
/*export function existsUrl(url: string) {
  if(!url) {
    return false;
  }
  
  const http = new XMLHttpRequest();
  http.open('HEAD', url, false);
  http.send();
  return http.status != 404;
}

export function isImageUrl(url: string) {
  if (!url) {
    return false;
  }

  try {
    const http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    let contentType = http.getResponseHeader('Content-Type');
    return contentType && contentType.indexOf("image") != -1;
  } catch (error) {
    console.error(error);
    return false;
  }
}*/

export function isImageData(data: string) {
  return data && data.startsWith('data:image/png;base64,');
}

/*export function asyncGet(url: string, callback: (xhr: any) => void) {
  const xhr = new XMLHttpRequest();

  xhr.onloadend = function() {
    // xhr.readyState === 4 is done
    callback(xhr);
  };

  xhr.open('GET', url, true);
  xhr.send();
}

export function syncGet(url: string) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send();
  return xhr;
}*/

export function shuffle(array: any[]) {
  let currentIndex = array.length,  randomIndex: number;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function callbackWhen(callback: () => void, when: () => boolean, retry: number = 5, delay: number = 250) {
  clearTimeout(uniqueTimeout);
  
  if(when()) {// is checked 6 times with retry = 5
    callback();
  } else if(retry > 0) {
    uniqueTimeout = setTimeout(() => {
      callbackWhen(callback, when, retry - 1);
    }, delay);
  }
}

export type ScrollPosition = 'top' | 'bottom' | 'center';

export function calcScrollOffset(element: any, scrollPos: ScrollPosition = 'center') {
  let offset: number;
  let elemOffset = element.offset().top;

  if (scrollPos == 'top') {
    offset = elemOffset;
  } else if (scrollPos == 'bottom') {
    offset = elemOffset + element.outerHeight(true);
  } else {
    let winHeight = $(window).height();
    let elemHeight = element.height();

    if (elemHeight < winHeight) {
      offset = elemOffset - (winHeight / 2 - elemHeight / 2);
    } else {
      offset = elemOffset;
    }
  }

  return offset;
}

export function moveScroll(offset: number) {
  $('html, body').animate({ scrollTop: offset }, 'slow');
}

export function moveScrollTo(selector: any, scrollPos: ScrollPosition = 'center', margin: number = 0) {
  let offset = calcScrollOffset($(selector), scrollPos);
  $('html, body').animate({ scrollTop: offset + margin }, 'slow');
}

export function moveScrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

export function loadPageList<T>(list: T[], paginatorData: PaginatorData, nextPage: number = undefined, selector: string = undefined, callback: () => void = undefined): T[] {
  let pageList = [];
  let listLength = list? list.length: 0;

  paginatorData.pageCount = Math.ceil(listLength / paginatorData.rows);

  if(nextPage !== undefined) {
    paginatorData.page = nextPage;
  }

  if(paginatorData.page > paginatorData.pageCount - 1) {
    paginatorData.page = paginatorData.pageCount - 1;
  } 
  
  if(paginatorData.page < 0) {
    paginatorData.page = 0;
  }

  paginatorData.first = paginatorData.page * paginatorData.rows;
  let end = paginatorData.first + paginatorData.rows;

  /*if(start >= listLength) {
    start = 0;
  }*/

  if(end >= listLength) {
    end = listLength;
  }
  
  for(let i = paginatorData.first; i < end; i++) {
    pageList.push(list[i]);
  }

  if(callback) {
    callbackWhen(callback, () => {
      return !selector || $(selector)[0];
    });
  }

  return pageList;
}

export function cleanValidationError() {
  $('.validation-error').stop().remove();
}

export function insertValidationError(elemId: string, errMsg: string, scrollPos: ScrollPosition = 'center') {
  $('.validation-error').stop().remove();
  const elem = $(elemId);
  const error = $("<span class='validation-error'>" + errMsg + "</span>");
  elem.append(error);
  error.fadeOut(500).fadeIn(500).fadeOut(500).fadeIn(500)/*.fadeOut(10000, function() {
    error.remove();
  })*/;

  moveScrollTo(elem, scrollPos);
}

 export function timeUnits(ms: number) {
  const allocate = (msUnit: number) => {
      const units = Math.trunc(ms / msUnit)
      ms -= units * msUnit
      return units
  }
  
  return {
      // weeks: (604800000), // Uncomment for weeks
      days: allocate(86400000),
      hours: allocate(3600000),
      minutes: allocate(60000),
      seconds: allocate(1000),
      ms: ms // remainder
  }
}

export function formatDuration(duration: number, addMs = false) {
  const units = timeUnits(duration);
  const d = units.days;
  const h = (units.hours < 10) ? "0" + units.hours : units.hours;
  const m = (units.minutes < 10) ? "0" + units.minutes : units.minutes;
  const s = (units.seconds < 10) ? "0" + units.seconds : units.seconds;
  let result = d + "d " + h + ":" + m + ":" + s;

  if(addMs) {
    const ms = (units.ms < 10) ? "00" + units.ms : ((units.ms < 100) ? "0" + units.ms : units.ms);
    result += "." + ms;
  }

  return result;
}

export function addCover(cnt: string, waitText: string): boolean {
  let id = cnt.substring(1) + "-cover-z1001";

  if($("#" + id)[0]) {
    return false;
  }
  
  const cover = $("<div />").attr("id", id).addClass("cover-z1001");

  if(waitText) {
    const frame = $("<div />").addClass("wait-frame");
    const image = $('<img alt="Spinner" src="assets/svg/spinner.svg" />').addClass("wait-image");
    const span = $("<span />").addClass("wait-text").text(waitText);
    cover.append(frame.append(image).append(span));
  }
  
  cover.appendTo($(cnt).css({ "position": "relative"/*, "opacity": ".5"*/ }));
  return true;
}

export function updateCover(cnt: string, waitText: string) {
  let id = cnt.substring(1) + "-cover-z1001";
  $("#" + id + " > .wait-frame > .wait-text").text(waitText);
}

export function removeCover(cnt: string) {
  let id = cnt.substring(1) + "-cover-z1001";
  $("#" + id).remove();
  //$(cnt).css({ "opacity": "1" });
}

export function setAppCover(waitText: string) {
  if(!addCover(".container", waitText)) {
    updateCover(".container", waitText);
  }
}

export function removeAppCover() {
  removeCover(".container");
}

export function launchDownload(filename: string, url: string) {
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = url;
  anchor.target = "_blank";
  anchor.click();
}

export function launchBlob(filename: string, blob: any) {
  /*const url = window.URL.createObjectURL(data);
  window.open(url);*/
  const url = window.URL.createObjectURL(blob);
  launchDownload(filename, url);
}

export function getValidFilename(filename: string) {
  filename = filename.replace(/[/\\?%*:|"<>]/g, '');

  if(filename.length > 251) {// 255 - 4
    filename = filename.substring(0, 251);
  }

  return filename;
}

export function downloadCSV(title: string, headers: string[], values: string[][]) {
  const filename = getValidFilename(title) + '.csv';
  let csv = '"' + headers.join('","') + '"\n';

  values.forEach(function (row) {
    csv += '"' + row.join('","') + '"\n';
  });

  const blob = new Blob([csv], { type:'text/csv' });
  launchBlob(filename, blob);
}

export function downloadExcel(title: string, headers: string[], values: string[][]) {
  let data = values;
  data.unshift(headers);

  if(title.length > 31) {
    title = title.substring(0, 31);
  }

  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: title,
    //Subject: "Test",
    Author: "Incentive (INC)",
    //CreatedDate: new Date(2017, 12, 19)
  };
  wb.SheetNames.push(title);

  let ws = XLSX.utils.aoa_to_sheet(data);
  wb.Sheets[title] = ws;

  let wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
  let octet = s2ab(wbout);

  let blob = new Blob([octet], { type:"application/octet-stream" });
  let filename = title.replace(/[/\\?%*:|"<>]/g, '-') + ".xlsx";

  launchBlob(filename, blob);
}

function s2ab(s: string) { 
  const buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  const view = new Uint8Array(buf);  //create uint8array as viewer
  for (let i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
  return buf;    
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], {
    type: 'text/plain'
  });
  launchBlob(filename, blob);
}

export function exportCoupons(coupons: string[]) {
  const filename = "coupons-" + new Date().getTime() + ".txt";
  let content = "";

  for(let i = 0; i < coupons.length; i++) {
    content += coupons[i];

    if(i < coupons.length - 1) {
      content += "\n";
    }
  }

  downloadText(filename, content);
}

export function printPage(element: ElementRef) {
  const header = $('app-root > .container > .header');
  const footer = $('app-root > .container > .footer');
  const recaptcha = $('.grecaptcha-badge');
  const scrollArrow = $('.show-scroll-top');
  const breadcrumbs = $('.breadcrumbs', element.nativeElement);
  const controls = $('.control-grid', element.nativeElement);
  const usingRecaptcha = recaptcha.is(":visible");

  header.hide();
  footer.hide();
  if(usingRecaptcha) recaptcha.hide();
  scrollArrow.hide();
  breadcrumbs.hide();
  controls.hide();

  window.print();

  header.show();
  footer.show();
  if(usingRecaptcha) recaptcha.show();
  scrollArrow.show();
  breadcrumbs.show();
  controls.show();
}

export function shortAddress(address: string) {
  if (!address) {
    return null;
  }

  let length = address.length;
  let start = address.substring(0, 6);
  let end = address.substring(length - 4, length);
  return start + "..." + end;
}

export function renderChart(chart: any) {
  chart.uniqueId = uniqueId();
  chart.render();
  charts[chart.uniqueId] = chart;
}

export function destroyChart(chart: any) {
  charts[chart.uniqueId] = undefined;
  chart.destroy();
}

export function filterOutliers(someArray: number[]) {

  if (someArray.length < 4)
    return someArray;

  let values = someArray.slice().sort((a, b) => a - b);//copy array fast and sort
  let q1: number, q3: number, iqr: number, maxValue: number, minValue: number;

  if ((values.length / 4) % 1 === 0) {//find quartiles
    q1 = 1 / 2 * (values[(values.length / 4)] + values[(values.length / 4) + 1]);
    q3 = 1 / 2 * (values[(values.length * (3 / 4))] + values[(values.length * (3 / 4)) + 1]);
  } else {
    q1 = values[Math.floor(values.length / 4 + 1)];
    q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
  }

  iqr = q3 - q1;
  maxValue = q3 + iqr * 1.5;
  minValue = q1 - iqr * 1.5;

  return values.filter((x) => (x >= minValue) && (x <= maxValue));
}

export function delay(time: number) {
  return new Promise<void>(resolve => {
      setTimeout(() => {
          resolve();
      }, time);
  });
}
