import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { UniswapWidget } from './UniswapWidget';

const containerElementName = 'uniswapWidgetContainer';

@Component({
    selector: 'uniswap-widget',
    template: `<span #${containerElementName}></span>`,
    // styleUrls: [''],
    encapsulation: ViewEncapsulation.None,
})
export class UniswapWidgetWrapper implements OnChanges, OnDestroy, AfterViewInit {

    @ViewChild(containerElementName, { static: true }) containerRef!: ElementRef;

    @Input() public provider: any;
    @Input() public jsonRpcEndpoint: string;
    @Input() public defaultInputTokenAddress: string;
    @Input() public defaultOutputTokenAddress: string;
    @Input() public convenienceFeeRecipient: string;
    @Input() public darkMode: boolean;

    tokenList: any;

    constructor() {
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.render();
    }

    ngAfterViewInit() {
        //this.render();
        this.loadAndRender();
    }

    ngOnDestroy() {
        ReactDOM.unmountComponentAtNode(this.containerRef.nativeElement);
    }

    loadAndRender = async() => {
        const data = await fetch(`https://tokens.uniswap.org`);
        const tokenData = await data.json();
        this.tokenList = tokenData.tokens;
        // TODO This will be done in the future when we have created a pool on uniswap.
        //this.tokenList.push(INC_TOKEN[CURRENT_CHAIN]);
        this.render();
    };

    // TODO use jsonRpcUrlMap, jsonRpcEndpoint is Deprecated
    // https://docs.uniswap.org/sdk/widgets/swap-widget/api/v1
    // https://docs.uniswap.org/sdk/widgets/swap-widget/api

    private render() {
        const { provider, jsonRpcEndpoint, defaultInputTokenAddress, defaultOutputTokenAddress, convenienceFeeRecipient, darkMode } = this;

        ReactDOM.render(
            <React.StrictMode>
                <div>
                    <UniswapWidget provider={provider} 
                    jsonRpcEndpoint={jsonRpcEndpoint}  
                    defaultInputTokenAddress={defaultInputTokenAddress} 
                    defaultOutputTokenAddress={defaultOutputTokenAddress}
                    convenienceFeeRecipient={convenienceFeeRecipient}
                    darkMode={darkMode}
                    tokenList={this.tokenList} />
                </div>
            </React.StrictMode>, 
            this.containerRef.nativeElement
        );
    }
}
