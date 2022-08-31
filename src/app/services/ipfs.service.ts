import { Injectable } from '@angular/core';
import { SurveyImpl } from '../models/survey-impl';
import { isIpfsUri } from '../shared/helper';
declare var Ipfs: any;

@Injectable({
  providedIn: 'root',
})
export class IpfsService {

  private node: any;

  constructor() {
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
        /*const ipfsUrls = uriToHttp(url);

        for (let ipfsUrl of ipfsUrls) {
            let response: string;

            try {
                const xhr = await this.request('GET', ipfsUrl, 3000);
                response = xhr.responseText;
            } catch(err) {
                console.error(err);
            }

            if (response) {
                result = response;
                break;
            }
        }  */

        const cid = url.substring(7);
        result = await this.cat(cid);
    }

    return Promise.resolve<string>(result);
}

async surveyLogo(survey: SurveyImpl): Promise<string> {
    let result: string;
    if(survey.imageData) {
        result = survey.imageData;
    } else if(survey.logoUrl) {
        result = await this.ipfsImage(survey.logoUrl);
    }

    return Promise.resolve<string>(result);
}

  private async create() {
    if(!this.node) {
      this.node = await Ipfs.create();
    }
  }
}
