
export class Web3Error extends Error {
  static readonly CODE_NOT_CONNECTED = 99991;
  static readonly CODE_INVALID_NETWORK = 99992;
  static readonly CODE_NOT_LOADED_CONTRACTS = 99993;

  constructor(public code: number, message?: string) {
    super(message);
  }
}
