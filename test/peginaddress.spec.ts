import { peginContractFixture } from './fixtures/pegincontract.fixtures';
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
      ElementsPegin.withFederationScript(peginContractFixture.redeemScript)
    );
  });

  it('should return pegin address', async () => {
    const address = await peginModule.getMainchainAddress(
      peginContractFixture.script
    );

    assert.notStrictEqual(address, undefined);
  });

  it('should compute pegin contract', async () => {
    const contract = await peginModule.peginContract(
      peginContractFixture.redeemScript,
      peginContractFixture.script
    );
    assert.strictEqual(contract, peginContractFixture.expectedContract);
  });
});
