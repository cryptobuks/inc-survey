import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { CONVENIENCE_FEE_ADDRESS, CURRENT_CHAIN, INC_TOKEN, NET_PARAMS } from 'src/app/shared/constants';
import { ListenerRemover } from 'src/app/shared/simple-listener';
import { UniswapWidgetWrapper } from 'src/extensions/UniswapWidgetWrapper';
import { BasePageComponent } from '../base-page.component';

@Component({
  selector: 'app-uniswap',
  templateUrl: './uniswap.component.html',
  styleUrls: ['./uniswap.component.css']
})
export class UniswapComponent extends BasePageComponent {

  readonly titleKey = "swap";

  provider: any;
  jsonRpcEndpoint: string;
  defaultInputTokenAddress: string;
  defaultOutputTokenAddress: string;
  convenienceFeeRecipient: string;
  darkMode: boolean;

  @ViewChild('uniswapWidget') uniswapWidget: UniswapWidgetWrapper;

  //private onChainLoadedRemover: ListenerRemover;
  private onThemeChangedRemover: ListenerRemover;

  constructor(element: ElementRef) {
    super(element);
  }

  onInit(): void {
    this.provider = this.web3.currentProvider;
    this.jsonRpcEndpoint = NET_PARAMS[CURRENT_CHAIN].rpcUrls[0];
    this.defaultInputTokenAddress = 'NATIVE';
    this.defaultOutputTokenAddress = INC_TOKEN[CURRENT_CHAIN].address;
    this.convenienceFeeRecipient = CONVENIENCE_FEE_ADDRESS[CURRENT_CHAIN];
    this.darkMode = AppComponent.instance.isDarkTheme;

    /*this.onChainLoadedRemover = this.web3Service.onChainLoaded.add(() => {
      this.defaultInputTokenAddress = MATIC_WRAPPED[CURRENT_CHAIN].address;
      this.defaultOutputTokenAddress = INC_TOKEN[CURRENT_CHAIN].address;
      this.uniswapWidget.ngOnChanges(undefined);
    });*/

    this.onThemeChangedRemover = AppComponent.instance.onThemeChanged.add(() => {
      this.darkMode = AppComponent.instance.isDarkTheme;
      this.uniswapWidget.ngOnChanges(undefined);
    });
  }

  onViewLoaded(): void {
  }

  onDestroy(): void {
    //this.onChainLoadedRemover();
    this.onThemeChangedRemover();
  }
}
