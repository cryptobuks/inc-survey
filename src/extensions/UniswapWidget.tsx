import * as React from 'react';
import { FunctionComponent, useState } from 'react';
import { darkTheme, lightTheme, SwapWidget } from '@uniswap/widgets'
import '@uniswap/widgets/fonts.css'

export interface IUniswapWidgetProps {
  provider: any;
  jsonRpcEndpoint: string;
  defaultInputTokenAddress: string;
  defaultOutputTokenAddress: string;
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

  const { provider, jsonRpcEndpoint, defaultInputTokenAddress, defaultOutputTokenAddress, darkMode, tokenList } = props;

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
          theme={darkMode ? darkTheme : lightTheme}
          tokenList={tokenList}
          width="100%"
          convenienceFee={5}
          convenienceFeeRecipient="0x8d7fb50F7f87c63C718f31a8d10362349720b56d"
        />
    </div>
  );
};
