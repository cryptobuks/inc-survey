import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ipfsToURL } from 'src/app/shared/helper';

@Component({
  selector: 'lazy-thumb',
  templateUrl: './lazy-thumb.component.html',
  styleUrls: ['./lazy-thumb.component.css']
})
export class LazyThumbComponent implements OnInit {

  @Input()
  get url(): string {
    return this._url;
  }
  set url(value: string) {
    if (value != this._url) {
      this.loadImage(value);
    }
  }
  _url: string;

  @Input()
  alt = "Thumb";

  @Input()
  type: 'image' | 'token' | 'token-list' = 'image';

  @Input()
  size: string;

  @Input()
  loading: boolean;

  @Output()
  onError: EventEmitter<any> = new EventEmitter();

  get isLoading(): boolean {
    return this.loading || this.loadingInternal;
  }

  empty: string;
  broken: string;
  loadingInternal: boolean;

  timeout: NodeJS.Timeout;

  constructor() {}

  ngOnInit(): void {
    if (this.type == 'token') {
      this.empty = "assets/img/empty_token.png";
      this.broken = "assets/img/unk_token.png";
    } else if (this.type == 'token-list') {
      this.empty = "assets/img/unk_list.png";
      this.broken = "assets/img/unk_list.png";
    } else {
      this.empty = "assets/img/empty_image.png";
      this.broken = "assets/img/broken_image.png";
    }
  }

  onImageLoad(event: Event) {
    this.loadingInternal = false;
  }

  onImageError(event: Event) {
    this.onError.emit(event);
    this._url = this.broken;
    this.loadingInternal = false;
  }

  async loadImage(value: string) {
    clearTimeout(this.timeout);

    if(value) {
      this.loadingInternal = true;
      this._url = ipfsToURL(value);
  
      this.timeout = setTimeout(() => {
        if(this.loadingInternal) {
          this.onImageError(undefined);
        }
      }, 5000);
    } else {
      this._url = value;
    }
  }
}
