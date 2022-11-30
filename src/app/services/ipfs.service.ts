import { Injectable } from '@angular/core';
import { isIpfsUri } from '../shared/helper';
declare var Ipfs: any;

@Injectable({
  providedIn: 'root',
})
export class IpfsService {

  private node: any;

  constructor() {
    if (!localStorage.ipfsRepoName) {
      this.setRepoName();
    }
  }

  async add(content: string) {
    await this.create();
    const { cid } = await this.node.add(content);
    console.log('cid: ' + cid);
    return cid;
  }

  async cat(cid: string) {
    await this.create();
    const stream = await this.node.cat(cid);
    let data = '';

    for await (const chunk of stream) {
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
