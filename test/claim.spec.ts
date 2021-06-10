import ElementsPegin from '../src';
import { address, confidential, ECPair, networks, Transaction, script as bscript } from 'liquidjs-lib';
import * as assert from 'assert';
import { claimTxFixture } from './fixtures/fixtures';
import { IdentityType, PrivateKey } from 'ldk';
import { broadcastLiquid, faucetBTC, fetchTxBTC, getTxOutProof, sleep } from './utils';
import * as btclib from 'bitcoinjs-lib';

const { btcTx, btcBlockProof, claimScript } = claimTxFixture;

const signingKeyWIF = 'cPNMJD4VyFnQjGbGs3kcydRzAbDCXrLAbvH6wTCqs88qg1SkZT3J';

jest.setTimeout(500_000)

describe('claimTx', () => {
  let peginModule: ElementsPegin;

  beforeAll(async () => {
    peginModule = new ElementsPegin(
      await ElementsPegin.withGoElements(),
      await ElementsPegin.withLibwally(),
      ElementsPegin.withDynamicFederation(false),
      ElementsPegin.withTestnet(),
      ElementsPegin.withFederationScript('52')
    );
  });

  it('should create a valid pegin transaction', async () => {

    const tx = await peginModule.claimTx(btcTx, btcBlockProof, claimScript);
    const transaction = Transaction.fromHex(tx);
    assert.strictEqual(transaction.ins[0].isPegin, true);
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

    const claimScript = address.toOutputScript((await identity.getNextAddress()).confidentialAddress).toString('hex');
    const mainChainAddr = await peginModule.getMainchainAddress(claimScript);
    const btcTxID = await faucetBTC(mainChainAddr);
    console.log(btcTxID)
    await sleep(5000);
    const btcTxOutProof = await getTxOutProof(btcTxID);
    console.log('btc outproof = ', btcTxOutProof);
    const btcTxHex = await fetchTxBTC(btcTxID);
    console.log('btc hex = ', btcTxHex);
    let claimTx = await peginModule.claimTx(btcTxHex, btcTxOutProof, claimScript);
    console.log('claimTx = ', claimTx);
    const transaction = Transaction.fromHex(claimTx)

    const prevoutTx = btclib.Transaction.fromHex(btcTxHex);
    const amountPegin = prevoutTx.outs[transaction.ins[0].index].value;
    // const prevoutScript = prevoutTx.outs[transaction.ins[0].index].script;
    console.log("amount pegin = ", amountPegin);

    const sigHash = transaction.hashForWitnessV0(
      0,
      Buffer.from(claimScript, 'hex'),
      confidential.satoshiToConfidentialValue(amountPegin),
      Transaction.SIGHASH_ALL
    )

    const ecPair = ECPair.fromWIF(signingKeyWIF, networks.regtest);
    const sig = ecPair.sign(sigHash)
    const signatureWithHashType = bscript.signature.encode(sig, Transaction.SIGHASH_ALL)
    transaction.ins[0].witness = [signatureWithHashType, ecPair.publicKey];
    claimTx = transaction.toHex();

    console.log('claimTx with witness = ', claimTx);

    const txid = await broadcastLiquid(claimTx);
    console.log('txid = ', txid)
  })
});
