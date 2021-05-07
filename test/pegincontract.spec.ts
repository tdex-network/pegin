import { PeginModule } from "../src";
import * as assert from "assert";
import { peginContractFixture } from "./fixtures/pegincontract.fixtures";

describe("peginContract", () => {
  let peginModule: PeginModule;

  beforeAll(async () => {
    peginModule = await PeginModule.create();
  });

  it("should compute pegin contract", async () => {
    const contract = await peginModule.peginContract(
      peginContractFixture.redeemScript,
      peginContractFixture.script
    );
    assert.strictEqual(contract, peginContractFixture.expectedContract);
  });
});
