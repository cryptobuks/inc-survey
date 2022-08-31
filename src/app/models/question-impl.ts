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
        content: QuestionImpl.amplifyContent(JSON.parse(question.content)),
        viewId: uniqueId(),
        mandatory: question.mandatory,
        validators: validators,
        response: {}
      };

      return impl;
    }

    static minifyContent(content: QuestionContent): MinifiedQuestionContent {
        return {
            t: content.title,
            d: content.description,
            e: content.errorMessage,
            ct: content.componentType,
            cd: content.componentData
        };
    }
    
    static amplifyContent(minified: MinifiedQuestionContent): QuestionContent {
        return {
            title: minified.t,
            description: minified.d,
            errorMessage: minified.e,
            componentType: minified.ct,
            componentData: minified.cd
        };
    }
}