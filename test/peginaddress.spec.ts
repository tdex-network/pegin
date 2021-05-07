import { peginContractFixture } from "./fixtures/pegincontract.fixtures";
import * as assert from "assert";
import { PeginModule } from "../src";

jest.setTimeout(10000);

describe("getpeginaddress", () => {
  let peginModule: PeginModule;

  beforeAll(async () => {
    peginModule = await PeginModule.create();
  });

  it("should return pegin address", async () => {
    const address = await peginModule.peginAddress(
      peginContractFixture.expectedContract,
      peginContractFixture.redeemScript,
      false,
      false
    );

    assert.notStrictEqual(address, undefined);
  });
});
