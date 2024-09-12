export type TSystemTransactionType = 'payment' | 'transfer';
export type TCustodialTransactionType = 'deposit' | 'withdraw';
export type TTransactionStatus =
  | 'created'
  | 'payment_confirmed'
  | 'lended'
  | 'approved'
  | 'transfered'
  | 'completed'
  | 'failed';

export type TTransferEvent = 'Transfer';

export type TBitcoinContract = 'bitcoin_mainnet' | 'bitcoin_testnet';
