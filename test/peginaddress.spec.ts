import { peginContractFixture } from './fixtures/pegincontract.fixtures';
import * as assert from 'assert';
import { loadPeginModule, PeginModule } from '../src';

jest.setTimeout(10000)

describe('getpeginaddress', () => {
  let peginModule: PeginModule;

  beforeAll(async () => {
    peginModule = await loadPeginModule();
  })

  it('should return pegin address', () => {
    const address = peginModule.peginAddress(
      peginContractFixture.expectedContract,
      peginContractFixture.federationScript,
      false,
      false
    )

    assert.notStrictEqual(address, undefined);
  })
})