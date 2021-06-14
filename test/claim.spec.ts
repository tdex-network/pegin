import ElementsPegin, { claimScriptToP2PKHScript } from '../src';
import {
  confidential,
  ECPair,
  networks,
  Transaction,
  script as bscript,
  address,
} from 'liquidjs-lib';
import { IdentityType, PrivateKey } from 'ldk';
import {
  broadcastLiquid,
  faucetBTC,
  fetchTxBTC,
  getTxOutProof,
  sleep,
} from './utils';
import * as btclib from 'bitcoinjs-lib';

const signingKeyWIF = 'cPNMJD4VyFnQjGbGs3kcydRzAbDCXrLAbvH6wTCqs88qg1SkZT3J';

jest.setTimeout(500_000);

describe('claimTx', () => {
  let peginModule: ElementsPegin;

  beforeAll(async () => {
    peginModule = new ElementsPegin(
      await ElementsPegin.withGoElements(),
      await ElementsPegin.withLibwally(),
      ElementsPegin.withDynamicFederation(false),
      ElementsPegin.withTestnet(),
      ElementsPegin.withFederationScript('51')
    );
  });

  it('should broadcast a pegin transaction created with claim function', async () => {
    const identity = new PrivateKey({
      chain: 'regtest',
      type: IdentityType.PrivateKey,
      value: {
        signingKeyWIF,
        blindingKeyWIF: 'cRdrvnPMLV7CsEak2pGrgG4MY7S3XN1vjtcgfemCrF7KJRPeGgW6',
      },
    });
    const ecPair = ECPair.fromWIF(signingKeyWIF, networks.regtest);

    const claimScript = address
      .toOutputScript((await identity.getNextAddress()).confidentialAddress)
      .toString('hex');
    const mainChainAddr = await peginModule.getMainchainAddress(claimScript);
    const btcTxID = await faucetBTC(mainChainAddr);
    await sleep(5000);
    const btcTxOutProof = await getTxOutProof(btcTxID);
    const btcTxHex = await fetchTxBTC(btcTxID);
    let claimTx = await peginModule.claimTx(
      btcTxHex,
      btcTxOutProof,
      claimScript
    );
    const transaction = Transaction.fromHex(claimTx);

    const prevoutTx = btclib.Transaction.fromHex(btcTxHex);
    const amountPegin = prevoutTx.outs[transaction.ins[0].index].value;

    const sigHash = transaction.hashForWitnessV0(
      0,
      Buffer.from(claimScriptToP2PKHScript(claimScript), 'hex'),
      confidential.satoshiToConfidentialValue(amountPegin),
      Transaction.SIGHASH_ALL
    );

    const sig = ecPair.sign(sigHash);
    const signatureWithHashType = bscript.signature.encode(
      sig,
      Transaction.SIGHASH_ALL
    );
    transaction.ins[0].witness = [signatureWithHashType, ecPair.publicKey];
    claimTx = transaction.toHex();

    const txid = await broadcastLiquid(claimTx);
    console.log('txid = ', txid);
  });
});
