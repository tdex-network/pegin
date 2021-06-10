import axios from 'axios';

const BTC_URL = 'http://localhost:3000';
export const LIQUID_URL = 'http://localhost:3001';

export async function faucetBTC(addr: string) {
  return (await axios.post(`${BTC_URL}/faucet`, { address: addr })).data.txId;
}

export async function fetchTxBTC(txID: string) {
  return (await axios.get(`${BTC_URL}/tx/${txID}/hex`)).data;
}

export async function getTxOutProof(txID: string) {
  return (await axios.get(`${BTC_URL}/tx/${txID}/merkleblock-proof`)).data;
}

export async function broadcastLiquid(tx: string) {
  return (await axios.post(LIQUID_URL, tx)).data;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}