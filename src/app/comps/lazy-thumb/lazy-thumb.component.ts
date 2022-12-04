import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IpfsService } from 'src/app/services/ipfs.service';

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
    if(value != this._url) {
      this._url = value;
      this.loadImage();
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
  imageData: string;
  loadingInternal: boolean;

  constructor(private ipfsService: IpfsService) { }

  ngOnInit(): void {
    if(this.type == 'token') {
      this.empty = "assets/img/empty_token.png";
      this.broken = "assets/img/unk_token.png";
    } else if(this.type == 'token-list') {
      this.empty = "assets/img/unk_list.png";
      this.broken = "assets/img/unk_list.png";
    } else {
      this.empty = "assets/img/empty_image.png";
      this.broken = "assets/img/broken_image.png";
    }
  }

  onErrorThrown(event: Event) {
    this.imageData = this.broken;
    this.onError.emit(event);
  }

  async loadImage() {
    this.loadingInternal = true;
    this.imageData = await this.ipfsService.ipfsImage(this.url);
    this.loadingInternal = false;
  }
}
