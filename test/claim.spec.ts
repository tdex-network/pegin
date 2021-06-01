import ElementsPegin from '../src';
import { Transaction } from 'liquidjs-lib';
import * as assert from 'assert';
import { claimTxFixture } from './fixtures/fixtures';

const { btcTx, btcBlockProof, claimScript } = claimTxFixture;

describe('e2e test - pegin transaction', () => {
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

  it('should broadcast a pegin transaction created with claim function', async () => {
    const tx = await peginModule.claimTx(btcTx, btcBlockProof, claimScript);
    const transaction = Transaction.fromHex(tx);
    assert.strictEqual(transaction.ins[0].isPegin, true);
  });
});
