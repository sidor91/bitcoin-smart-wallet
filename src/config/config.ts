export default () => {
  // const username = process.env.BTC_USER;
  // if (!username) {
  //   throw new Error(`BTC_USER is missed!`);
  // }
  // const password = process.env.BTC_PASSWORD;
  // if (!password) {
  //   throw new Error(`BTC_PASSWORD is missed!`);
  // }
  // const host = process.env.BTC_HOST;
  // if (!host) {
  //   throw new Error(`BTC_HOST is missed!`);
  // }
  // const btcPort = process.env.BTC_PORT;
  // if (!btcPort) {
  //   throw new Error(`BTC_PORT is missed!`);
  // }

  // const SUBSCRIPTION_DELAY = process.env.SUBSCRIPTION_DELAY;
  const BLOCKCHAIN_SUBSCRIPTION_DELAY =
    process.env.BLOCKCHAIN_SUBSCRIPTION_DELAY;
  const WITHDRAW_SUBSCRIPTION_DELAY = process.env.WITHDRAW_SUBSCRIPTION_DELAY;
  const masterWallet = process.env.MASTER_WALLET;
  if (!masterWallet) {
    throw new Error(`MASTER_WALLET is missed!`);
  }

  const masterWalletPk = process.env.MASTER_WALLET_PK;
  if (!masterWalletPk) {
    throw new Error(`MASTER_WALLET_PK is missed!`);
  }

  const sendToMasterDelay = process.env.SEND_TO_MASTER_DELAY;

  return {
    sendToMasterDelay,
    BLOCKCHAIN_SUBSCRIPTION_DELAY,
    WITHDRAW_SUBSCRIPTION_DELAY,
    // SUBSCRIPTION_DELAY,
    // rpcConfig: {
    //   username,
    //   password,
    //   host,
    //   port: btcPort,
    // },
    masterWallet,
    masterWalletPk,
  };
};
