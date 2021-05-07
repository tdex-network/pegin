import "../resources/wasm_exec.cjs";
import { readFileSync } from "fs";
import { loadWasm, peginContractScriptFromBytes } from "./pegincontract";

// @ts-ignore
const go = new Go();
const WASM_URL = "main.wasm"; // TODO improve this??

interface WASMPeginModuleInterface {
  peginAddress: (
    contract: string,
    redeemScript: string,
    isDynaFed: boolean,
    isMainnet: boolean
  ) => string;
  peginContract: (redeemScript: string, script: string) => string;
}

type PeginModuleOption = (module: PeginModule) => void

export class PeginModule implements WASMPeginModuleInterface {
  peginAddress: (contract: string, redeemScript: string, isDynaFed: boolean, isMainnet: boolean) => string;
  peginContract: (redeemScript: string, script: string) => string;

  constructor(option: PeginModuleOption) {
    this.peginAddress = () => '' // default value
    this.peginContract = () => ''
    option(this)
  }

  public static async withWASM(): Promise<PeginModuleOption> {
    const wasmModule = await loadPeginFromWasm()
    return (mod: PeginModule) => {
      mod.peginAddress = wasmModule.peginAddress
      mod.peginContract = wasmModule.peginContract
    }
  }
}

/**
 * get the instance, run wasm and return PeginModule
 */
async function loadPeginFromWasm(): Promise<WASMPeginModuleInterface> {
  const instance = await webAssemblyInstance();
  go.run(instance);
  await loadWasm();
  return {
    peginAddress: peginAddressJSwrapper,
    peginContract: peginContractScriptFromBytes
  };
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
): string {
  return returnOrThrowIfError<string>(() =>
    // @ts-ignore
    peginAddress(contract, fedPegScript, isDynaFed, isMainnet)
  );
}

function returnOrThrowIfError<T>(func: () => { result: T; error: string }): T {
  const { result, error } = func();
  if (error) {
    throw new Error(error);
  }

  if (result) {
    return result;
  }

  throw new Error("empty return object");
}

