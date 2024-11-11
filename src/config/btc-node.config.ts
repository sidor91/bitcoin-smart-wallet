export default () => {
  const username = process.env.BTC_NODE_USER;
  if (!username) {
    throw new Error(`BTC_NODE_USER is missed!`);
  }
  const password = process.env.BTC_NODE_PASSWORD;
  if (!password) {
    throw new Error(`BTC_NODE_PASSWORD is missed!`);
  }
  const host = process.env.BTC_NODE_URL;
  if (!host) {
    throw new Error(`BTC_NODE_URL is missed!`);
  }
  const port = process.env.BTC_NODE_PORT;
  if (!port) {
    throw new Error(`BTC_NODE_PORT is missed!`);
  }

  return { btc_config: { username, password, host, port } };
};
