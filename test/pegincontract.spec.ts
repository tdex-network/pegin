import { loadPeginModule, PeginModule } from "../src";
import * as assert from "assert";
import { peginContractFixture } from "./fixtures/pegincontract.fixtures";

describe("peginContract", () => {
  let peginModule: PeginModule;

  beforeAll(async () => {
    peginModule = await loadPeginModule();
  });

  it("should compute pegin contract", () => {
    const contract = peginModule.peginContract(
      peginContractFixture.federationScript,
      peginContractFixture.scriptIn
    );
    assert.strictEqual(contract, peginContractFixture.expectedContract);
  });
});
