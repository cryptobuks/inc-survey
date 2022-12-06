import { uniqueId } from "../shared/helper";
import { Question, QuestionValidator } from "./survey-model";
import { MinifiedQuestionContent, QuestionContent, ResponseHandler } from "./survey-support";

export class QuestionImpl {
    content: QuestionContent;
    viewId: string;// Not saved in blockchain
    mandatory: boolean;
    validators: QuestionValidator[];
    validationDescKeys?: string[];
    response: ResponseHandler;

    // Question.responseType not used
    static toImpl(question: Question, validators: QuestionValidator[]): QuestionImpl {
      let impl: QuestionImpl = {
        content: QuestionImpl.amplifyContent(question.content),
        viewId: uniqueId(),
        mandatory: question.mandatory,
        validators: validators,
        response: {}
      };

      return impl;
    }

    static minifyContent(content: QuestionContent): string {
        const minified: MinifiedQuestionContent = {
            t: content.title,
            d: content.description,
            e: content.errorMessage,
            ct: content.componentType,
            cd: content.componentData
        };
        return JSON.stringify(minified);
    }
    
    static amplifyContent(content: string): QuestionContent {
        const minified = JSON.parse(content) as MinifiedQuestionContent;
        
        return {
            title: minified.t,
            description: minified.d,
            errorMessage: minified.e,
            componentType: minified.ct,
            componentData: minified.cd
        };
    }
}