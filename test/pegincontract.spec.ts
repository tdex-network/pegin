import { PeginModule } from "../src";
import * as assert from "assert";
import { peginContractFixture } from "./fixtures/pegincontract.fixtures";

describe("peginContract", () => {
  let peginModule: PeginModule;

  beforeAll(async () => {
    peginModule = new PeginModule(await PeginModule.withWASM());
  });

  it("should compute pegin contract", () => {
    const contract = peginModule.peginContract(
      peginContractFixture.redeemScript,
      peginContractFixture.script
    );
    assert.strictEqual(contract, peginContractFixture.expectedContract);
  });
});
