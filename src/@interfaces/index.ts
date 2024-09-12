import { Signer } from 'bitcoinjs-lib';
import { TCustodialTransactionType } from 'src/@types';

export interface TokenInfo {
  symbol: string;
  network: string;
  chain_id: string;
  decimals: number;
}
export interface IContractEvent {
  amount: number;
  transactionHash: string;
  sender: string;
  receiver: string;
  tx_output_n: number;
}
export interface TTransferTokensParam {
  chain_id: string;
  tokenAddress: string;
  amount: bigint;
  address: string;
}

export interface ICustodialTransaction {
  key: string;
  user: string;
  tokenAddress: string | null;
  token: string | null;
  amount: string;
  sender: string;
  receiver: string;
  type: TCustodialTransactionType;
  chain_id: string | null;
}
export interface IUnspentTransaction {
  key: string;
  hash: string;
  tx_output_n: number;
  amount: string;
  address: string;
  block_height: number;
  spent?: boolean;
  chain_id: string;
  keyPair?: Signer;
}
