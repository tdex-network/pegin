import * as assert from "assert";
import { ECPair, networks } from "liquidjs-lib";
import { loadPeginModule, PeginModule } from "../src";

describe("claimWitnessScript", () => {
  let peginModule: PeginModule;

  beforeAll(async () => {
    peginModule = await loadPeginModule();
  });

  it("should return pegin address", () => {
    const { publicKey } = ECPair.makeRandom({ network: networks.regtest });
    const witnessScript = peginModule.claimWitnessScript(
      publicKey.toString("hex"),
      false
    );

    assert.notStrictEqual(witnessScript, undefined);
  });
});
