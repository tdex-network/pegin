import "../resources/wasm_exec.cjs";
import { readFileSync } from "fs";
import { WallycoreModule } from "./pegincontract";

// @ts-ignore
const go = new Go();
const WASM_URL = "main.wasm"; // TODO improve this??

interface ElementsPeginInterface {
  getMainchainAddress(claimScript: string): Promise<string>; // returns the mainchain address
}

type PeginModuleOption = (module: ElementsPegin) => void;

export class ElementsPegin implements ElementsPeginInterface {
  private wallycore: WallycoreModule | undefined;
  private isMainnet: boolean = false;
  private isDynamicFederation: boolean = false;
  private federationScript: string = "";

  constructor(options: PeginModuleOption[]) {
    for (const option of options) {
      option(this);
    }
  }

  async getMainchainAddress(claimScript: string): Promise<string> {
    const contract = await this.peginContract(
      this.federationScript,
      claimScript
    );
    const peginAddress = await peginAddressJSwrapper(
      contract,
      this.federationScript,
      this.isDynamicFederation,
      this.isMainnet
    );
    return peginAddress;
  }

  private async peginContract(redeemScript: string, script: string) {
    if (!this.wallycore)
      throw new Error(
        "need wallycore to be defined in order ot use peginContract function"
      );
    return this.wallycore.peginContract(redeemScript, script);
  }

  public static withFederationScript(federationScript: string) {
    return (module: ElementsPegin) => {
      module.federationScript = federationScript;
    };
  }

  public static withDynamicFederation(dynaFed: boolean) {
    return (module: ElementsPegin) => {
      module.isDynamicFederation = dynaFed;
    };
  }

  public static withNetwork(net: "mainnet" | "regtest") {
    return (module: ElementsPegin) => {
      module.isMainnet = net === "mainnet";
    };
  }

  public static async withWasm(): Promise<PeginModuleOption> {
    await runGoWASMinstance(); // for go wasm
    const wally = await WallycoreModule.create();
    return (module: ElementsPegin) => {
      module.wallycore = wally;
    };
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
