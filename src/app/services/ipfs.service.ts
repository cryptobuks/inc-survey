import { Injectable, OnDestroy } from '@angular/core';
import { ipfsToURL, isIpfsUri } from '../shared/helper';
import { UtilService } from './util.service';
declare var Ipfs: any;

@Injectable({
  providedIn: 'root',
})
export class IpfsService implements OnDestroy {

  private node: any;

  constructor(private utilService: UtilService) {
    if (!localStorage.ipfsRepoName) {
      this.setRepoName();
    }
  }

  ngOnDestroy() {
    // stopping a node
    this.node && this.node.stop();
    console.log('IpfsService destroyed.');
  }

  async add(content: any) {
    await this.create();
    const { cid } = await this.node.add(content);
    console.log('cid: ' + cid);
    return cid;
  }

  /**
   * ipfs-js sometimes crashes during ´stream´ iteration (when the resource is wrong).
   * Using the HTTP Gateway: https://ipfs.io/ipfs/QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A
   * /
  async cat(cid: string) {
    await this.create();
    const stream = await this.node.cat(cid);
    let data = '';

    for await (const chunk of stream) {<-- It crashes here, there seems to be no timeout.
      // chunks of data are returned as a Buffer, convert it back to a string
      data += chunk.toString();
    }

    return data;
  }

  async ipfsImage(url: string): Promise<string> {
    let result = url;

    if (isIpfsUri(url)) {
      try {
        const cid = url.substring(7);
        result = await this.cat(cid);
      } catch (err) {
        console.error(err);
        // Reset repository name
        this.setRepoName();
      }
    }

    return Promise.resolve<string>(result);
  }*/

  // For image saved as Base64
  async ipfsImage(url: string, timeout = 3000): Promise<string> {
    let result = url;

    if (isIpfsUri(url)) {
      try {
        const ipfsUrl = ipfsToURL(url);
        const xhr = await this.utilService.request('GET', ipfsUrl, timeout);
        result = xhr.responseText;
      } catch (error) {
        console.error(error.message);
      }
    }

    return Promise.resolve<string>(result);
  }

  private setRepoName() {
    localStorage.ipfsRepoName = "repo-" + Math.random();
  }

  private async create() {
    if (!this.node) {
      this.node = await Ipfs.create({ repo: localStorage.ipfsRepoName });
    }
  }
}
