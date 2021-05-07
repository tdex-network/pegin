import "../resources/wasm_exec.cjs";
import { readFileSync } from "fs";
import { WallycoreModule } from "./pegincontract";

// @ts-ignore
const go = new Go();
const WASM_URL = "main.wasm"; // TODO improve this??

type PeginContractFunction = (
  redeemScript: string,
  script: string
) => Promise<string>;
type PeginAddressFunction = (
  contract: string,
  redeemScript: string,
  isDynaFed: boolean,
  isMainnet: boolean
) => Promise<string>;

interface WASMPeginModuleInterface {
  peginAddress: PeginAddressFunction;
  peginContract: PeginContractFunction;
}

type PeginModuleOption = (module: PeginModule) => void;

export class PeginModule implements WASMPeginModuleInterface {
  peginAddress: PeginAddressFunction;
  private wallycore: WallycoreModule | undefined;

  constructor(options: PeginModuleOption[]) {
    this.peginAddress = () => new Promise(() => ""); // default value

    for (const option of options) {
      option(this);
    }
  }

  peginContract: PeginContractFunction = (
    redeemScript: string,
    script: string
  ) => {
    if (!this.wallycore)
      throw new Error(
        "need wallycore to be defined in order ot use peginContract function"
      );
    return this.wallycore.peginContract(redeemScript, script);
  };

  public static async withGoElementsWASM(): Promise<PeginModuleOption> {
    await runGoWASMinstance();
    return (mod: PeginModule) => {
      mod.peginAddress = peginAddressJSwrapper; // set pegin address
    };
  }

  public static async withWallycoreWASM(): Promise<PeginModuleOption> {
    const wally = await WallycoreModule.create();
    return (mod: PeginModule) => {
      mod.wallycore = wally; // set the peginContract function
    };
  }

  public static async create(): Promise<PeginModule> {
    return new PeginModule(
      await Promise.all([
        PeginModule.withGoElementsWASM(),
        PeginModule.withWallycoreWASM()
      ])
    );
  }
}

async function runGoWASMinstance() {
  const instance = await webAssemblyInstance();
  go.run(instance);
}

/**
 * return the WebAssembly.Instance according to current environment (web or node)
 */
async function webAssemblyInstance(): Promise<
  WebAssembly.Instance | WebAssembly.WebAssemblyInstantiatedSource
> {
  if (typeof window === "undefined") {
    // node
    const mod = await WebAssembly.compile(readFileSync(WASM_URL));
    return WebAssembly.instantiate(mod, go.importObject);
  }
  // web
  return WebAssembly.instantiateStreaming(fetch(WASM_URL), go.importObject);
}

function peginAddressJSwrapper(
  contract: string,
  fedPegScript: string,
  isDynaFed: boolean,
  isMainnet: boolean
): Promise<string> {
  // @ts-ignore
  return peginAddress(contract, fedPegScript, isDynaFed, isMainnet);
}
