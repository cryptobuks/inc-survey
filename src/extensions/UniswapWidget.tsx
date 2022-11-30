import * as React from 'react';
import { FunctionComponent, useState } from 'react';
import { darkTheme, lightTheme, SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';

export interface IUniswapWidgetProps {
  provider: any;
  jsonRpcEndpoint: string;
  defaultInputTokenAddress: string;
  defaultOutputTokenAddress: string;
  convenienceFeeRecipient: string;
  darkMode: boolean;
  tokenList: any;
}

const useConstructor = (callBack: () => void) => {
  const [hasBeenCalled, setHasBeenCalled] = useState(false);
  if (hasBeenCalled) return;
  callBack();
  setHasBeenCalled(true);
};

export const UniswapWidget: FunctionComponent<IUniswapWidgetProps> = (props: IUniswapWidgetProps) => {

  const { provider, jsonRpcEndpoint, defaultInputTokenAddress, defaultOutputTokenAddress, convenienceFeeRecipient, darkMode, tokenList } = props;

  useConstructor(() => {
    // Occurs ONCE, BEFORE the initial render.
    lightTheme.container = "#ffffff";
  });

  return (
    <div className="Uniswap">
        <SwapWidget
          provider={provider}
          jsonRpcEndpoint={jsonRpcEndpoint}
          defaultInputTokenAddress={defaultInputTokenAddress}
          defaultOutputTokenAddress={defaultOutputTokenAddress}
          convenienceFeeRecipient={convenienceFeeRecipient}
          theme={darkMode ? darkTheme : lightTheme}
          tokenList={tokenList}
          width="100%"
          convenienceFee={5}
        />
    </div>
  );
};
