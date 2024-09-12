import { Network } from '@custodial/proto/dist/common';
import * as networksData from './networks.json';

export default () => {
  const networks: Network[] = networksData.map((n) => {
    return {
      name: n.network,
      chain_id: n.chain_id,
      tokens: n.tokens.map((t) => {
        return {
          address: t.address,
          symbol: t.symbol,
          decimals: t.decimals,
        };
      }),
    };
  });
  return {
    networks,
  };
};
