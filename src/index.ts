import "./lib/wasm_exec.cjs";
import { readFileSync } from "fs";
import { loadWasm, peginContractScriptFromBytes } from "./pegincontract";

const WASM_URL = "src/main.wasm"; // TODO improve this??

// @ts-ignore
const go = new Go();

export interface PeginModule {
  peginAddress: (contract: string, fedPegScript: string, isDynaFed: boolean, isMainnet: boolean) => string;
  claimWitnessScript: (publicKey: string, isMainnet: boolean) => string;
  peginContract: (federationScript: string, scriptIn: string) => string;
}

/**
 * return the WebAssembly.Instance according to current environment (web or node)
 */
async function webAssemblyInstance(): Promise<WebAssembly.Instance | WebAssembly.WebAssemblyInstantiatedSource> {
  if (typeof window === 'undefined') {
    // node
    const mod = await WebAssembly.compile(readFileSync(WASM_URL));
    return WebAssembly.instantiate(mod, go.importObject);
  }
  // web
  return WebAssembly.instantiateStreaming(fetch(WASM_URL), go.importObject)
}

function peginAddressJSwrapper(contract: string, fedPegScript: string, isDynaFed: boolean, isMainnet: boolean): string {
  // @ts-ignore
  return returnOrThrowIfError<string>(() => peginAddress(contract, fedPegScript, isDynaFed, isMainnet))
}

function claimWitnessScriptJSwrapper(publicKey: string, isMainnet: boolean): string {
  // @ts-ignore
  return returnOrThrowIfError<string>(() => claimWitnessScript(publicKey, isMainnet))

}

function returnOrThrowIfError<T>(func: () => { result: T, error: string }): T {
  const { result, error } = func();
  if (error) {
    throw new Error(error);
  }

  if (result) {
    return result;
  }

  throw new Error('empty return object');
}

/**
 * get the instance, run wasm and return PeginModule
 */
export async function loadPeginModule(): Promise<PeginModule> {
  const instance = await webAssemblyInstance();
  go.run(instance);
  await loadWasm();
  return {
    peginAddress: peginAddressJSwrapper,
    claimWitnessScript: claimWitnessScriptJSwrapper,
    peginContract: peginContractScriptFromBytes,
  }
}