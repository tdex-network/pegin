import { peginContractFixture } from './fixtures/fixtures';
import * as assert from 'assert';
import ElementsPegin from '../src';

jest.setTimeout(10000);

describe('getpeginaddress', () => {
  let peginModule: ElementsPegin;

  beforeAll(async () => {
    peginModule = new ElementsPegin(
      await ElementsPegin.withGoElements(),
      await ElementsPegin.withLibwally(),
      ElementsPegin.withDynamicFederation(false),
      ElementsPegin.withMainnet(),
      ElementsPegin.withFederationScript(ElementsPegin.MAINNET_FED_SCRIPT)
    );
  });

  it('should return pegin address (P2SH with dynafed = false)', async () => {
    const address = await peginModule.getMainchainAddress(
      peginContractFixture.script
    );
    assert.strictEqual(address, '3AV836ASdCs6k25KjFweWxXNKyJdNx2tFh');
  });

  it('should return pegin address (P2WSH with dynafed = true)', async () => {
    peginModule = new ElementsPegin(
      await ElementsPegin.withGoElements(),
      await ElementsPegin.withLibwally(),
      ElementsPegin.withDynamicFederation(true),
      ElementsPegin.withMainnet(),
      ElementsPegin.withFederationScript(ElementsPegin.MAINNET_FED_SCRIPT)
    );

    const address = await peginModule.getMainchainAddress(
      peginContractFixture.script
    );
    assert.strictEqual(address.slice(0, 3), 'bc1');
  });

  it('should compute pegin contract', async () => {
    const contract = await peginModule.peginContract(
      peginContractFixture.redeemScript,
      peginContractFixture.script
    );
    assert.strictEqual(contract, peginContractFixture.expectedContract);
  });
});
