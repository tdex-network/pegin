import { WallycoreModule } from "./../src/pegincontract";
import * as assert from "assert";
import { peginContractFixture } from "./fixtures/pegincontract.fixtures";

describe("peginContract", () => {
  let contractModule: WallycoreModule;

  beforeAll(async () => {
    contractModule = await WallycoreModule.create();
  });

  it("should compute pegin contract", async () => {
    const contract = await contractModule.peginContract(
      peginContractFixture.redeemScript,
      peginContractFixture.script
    );
    assert.strictEqual(contract, peginContractFixture.expectedContract);
  });
});
