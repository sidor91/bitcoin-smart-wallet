export interface RawTransaction {
  in_active_chain?: boolean;
  hex: string;
  txid: string;
  hash: string;
  size: number;
  vsize: number;
  weight: number;
  version: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  blockhash: string;
  confirmations: number;
  blocktime?: number;
  time?: number;
}

interface Vin {
  txid: string;
  vout: number;
  scriptSig: ScriptSig;
  sequence: number;
  txinwitness?: string[];
}

interface ScriptSig {
  asm: string;
  hex: string;
}

interface Vout {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
}

interface ScriptPubKey {
  asm: string;
  hex: string;
  reqSigs?: number;
  type: string;
  addresses?: string[];
  address?: string;
}

export interface ParsedTransaction {
  sender: string;
  receiver: string;
  amount: string;
  hash: string;
  tx_output_n: number;
  block_hash: string;
}

export interface GetBlockResponseTransaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  hex: string;
}

export interface GetBlockResponse {
  hash: string;
  confirmations: number;
  size: number;
  strippedsize: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string[] | GetBlockResponseTransaction[];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
  nextblockhash?: string;
}

interface TransactionDetail {
  address: string;
  parent_descs: string[];
  category: 'send' | 'receive';
  amount: number;
  label: string;
  vout: number;
  abandoned: boolean;
}

interface LastProcessedBlock {
  hash: string;
  height: number;
}

export interface GetTransactionResponse {
  amount: number;
  confirmations: number;
  blockhash: string;
  blockheight: number;
  blockindex: number;
  blocktime: number;
  txid: string;
  wtxid: string;
  walletconflicts: string[];
  time: number;
  timereceived: number;
  bip125Replaceable: 'yes' | 'no';
  details: TransactionDetail[];
  hex: string;
  lastprocessedblock: LastProcessedBlock;
}
