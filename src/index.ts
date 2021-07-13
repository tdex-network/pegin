interface ElementsPeginInterface {
  claimTx(
    btcTx: string,
    btcTxOutProof: string,
    claimScript: string,
    millisatPerByte: number
  ): Promise<string>; // returns the claim tx (hex encoded)
  getMainchainAddress(claimScript: string): Promise<string>; // returns the mainchain address
}

type PeginModuleOption = (module: ElementsPegin) => void;

export default class ElementsPegin implements ElementsPeginInterface {
  private wallycore: any;
  private mainChainAddress:
    | ((
        contract: string,
        fedPegScript: string,
        isDynaFed: boolean,
        isMainnet: boolean
      ) => Promise<string>)
    | undefined;

  private claim:
    | ((
        isMainnet: boolean,
        isDynaFed: boolean,
        peggedAsset: string,
        parentGenesisBlockHash: string,
        fedPegScript: string,
        contract: string,
        btcTx: string,
        btcTxOutProof: string,
        claimScript: string,
        millisatPerByte: number
      ) => Promise<string>)
    | undefined;

  private isMainnet: boolean = true;
  private isDynamicFederation: boolean = false;
  private federationScript: string = ElementsPegin.MAINNET_FED_SCRIPT;

  constructor(...options: PeginModuleOption[]) {
    for (const option of options) {
      option(this);
    }
  }

  async claimTx(
    btcTx: string,
    btcTxOutProof: string,
    claimScript: string,
    millisatPerByte: number = 1
  ): Promise<string> {
    if (!this.claim) throw new Error('need claim to be defined');

    if (!this.wallycore)
      throw new Error(
        'need wallycore to be defined in order to compute mainchain address'
      );

    const contract = await this.peginContract(
      this.federationScript,
      claimScript
    );

    return this.claim(
      this.isMainnet,
      this.isDynamicFederation,
      this.getPeggedAsset(),
      ElementsPegin.PARENT_BLOCK_HASH,
      this.federationScript,
      contract,
      btcTx,
      btcTxOutProof,
      claimScript,
      millisatPerByte
    );
  }

  async getMainchainAddress(claimScript: string): Promise<string> {
    if (!this.mainChainAddress)
      throw new Error(
        'need mainChainAddress to be defined in order to compute mainchain address'
      );

    if (!this.wallycore)
      throw new Error(
        'need wallycore to be defined in order to compute mainchain address'
      );

    const contract = await this.peginContract(
      this.federationScript,
      claimScript
    );

    const address = await this.mainChainAddress(
      contract,
      this.federationScript,
      this.isDynamicFederation,
      this.isMainnet
    );
    return address;
  }

  /**
   * get contract script hex (wrapper for wally_elements_pegin_contract_script_from_bytes)
   * @param redeemScript
   * @param script
   */
  async peginContract(redeemScript: string, script: string): Promise<string> {
    const redeemScriptBytes = hexStringToBytes(redeemScript);
    const scriptBytes = hexStringToBytes(script);

    const contractPtr = this.wallycore._malloc(redeemScriptBytes.length);
    const numOfBytesPtr = this.wallycore._malloc(4);

    const returnCode = this.wallycore.ccall(
      'wally_elements_pegin_contract_script_from_bytes',
      ['number'],
      [
        'array',
        'number',
        'array',
        'number',
        'number',
        'number',
        'number',
        'number',
      ],
      [
        redeemScriptBytes,
        redeemScriptBytes.length,
        scriptBytes,
        scriptBytes.length,
        0,
        contractPtr,
        redeemScriptBytes.length,
        numOfBytesPtr,
      ]
    );

    if (returnCode !== 0) {
      throw new Error(
        `wally_elements_pegin_contract_script_from_bytes error: ${returnCode}`
      );
    }

    const written = this.wallycore.getValue(numOfBytesPtr, 'i32');

    const contractString = toHexString(this.readBytes(contractPtr, written));

    this.wallycore._free(contractPtr);
    this.wallycore._free(numOfBytesPtr);
    return contractString;
  }

  private readBytes(ptr: number, size: number): Uint8Array {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++)
      bytes[i] = this.wallycore.getValue(ptr + i, 'i8');
    return bytes;
  }

  private getPeggedAsset(): string {
    return this.isMainnet
      ? '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d'
      : '5ac9f65c0efcc4775e0baec4ec03abdde22473cd3cf33c0419ca290e0751b225';
  }

  public static withFederationScript(federationScript: string) {
    return (mod: ElementsPegin) => {
      mod.federationScript = federationScript;
    };
  }

  public static withDynamicFederation(dynaFed: boolean) {
    return (mod: ElementsPegin) => {
      mod.isDynamicFederation = dynaFed;
    };
  }

  public static withMainnet() {
    return (mod: ElementsPegin) => {
      mod.isMainnet = true;
    };
  }

  public static withTestnet() {
    return (mod: ElementsPegin) => {
      mod.isMainnet = false;
    };
  }

  public static async withGoElements(): Promise<PeginModuleOption> {
    await runGoWASMinstance(); // set mainChainAddress in JS global scope
    return (p: ElementsPegin): void => {
      // @ts-ignore
      p.mainChainAddress = mainChainAddress;
      // @ts-ignore
      p.claim = claim;
    };
  }

  public static async withLibwally(): Promise<PeginModuleOption> {
    const libwally = require('../resources/wallycore');
    const wallycore = await libwally();
    return (p: ElementsPegin): void => {
      // @ts-ignore
      p.wallycore = wallycore;
    };
  }

  public static claimScriptToP2PKHScript(claimScript: string): string {
    return `76a9${claimScript.slice(2)}88ac`;
  }

  public static PARENT_BLOCK_HASH =
    '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206';

  public static MAINNET_FED_SCRIPT =
    '745c87635b21020e0338c96a8870479f2396c373cc7696ba124e8635d41b0ea581112b678172612102675333a4e4b8fb51d9d4e22fa5a8eaced3fdac8a8cbf9be8c030f75712e6af992102896807d54bc55c24981f24a453c60ad3e8993d693732288068a23df3d9f50d4821029e51a5ef5db3137051de8323b001749932f2ff0d34c82e96a2c2461de96ae56c2102a4e1a9638d46923272c266631d94d36bdb03a64ee0e14c7518e49d2f29bc40102102f8a00b269f8c5e59c67d36db3cdc11b11b21f64b4bffb2815e9100d9aa8daf072103079e252e85abffd3c401a69b087e590a9b86f33f574f08129ccbd3521ecf516b2103111cf405b627e22135b3b3733a4a34aa5723fb0f58379a16d32861bf576b0ec2210318f331b3e5d38156da6633b31929c5b220349859cc9ca3d33fb4e68aa08401742103230dae6b4ac93480aeab26d000841298e3b8f6157028e47b0897c1e025165de121035abff4281ff00660f99ab27bb53e6b33689c2cd8dcd364bc3c90ca5aea0d71a62103bd45cddfacf2083b14310ae4a84e25de61e451637346325222747b157446614c2103cc297026b06c71cbfa52089149157b5ff23de027ac5ab781800a578192d175462103d3bde5d63bdb3a6379b461be64dad45eabff42f758543a9645afd42f6d4248282103ed1e8d5109c9ed66f7941bc53cc71137baa76d50d274bda8d5e8ffbd6e61fe9a5f6702c00fb275522103aab896d53a8e7d6433137bbba940f9c521e085dd07e60994579b64a6d992cf79210291b7d0b1b692f8f524516ed950872e5da10fb1b808b5a526dedc6fed1cf29807210386aa9372fbab374593466bc5451dc59954e90787f08060964d95c87ef34ca5bb5368ae';
}

async function runGoWASMinstance() {
  require('../resources/wasm_exec');
  // @ts-ignore
  const go = new Go();
  let instance:
    | WebAssembly.Instance
    | WebAssembly.WebAssemblyInstantiatedSource;

  if (typeof window === 'undefined') {
    // node
    const { readFileSync } = require('fs');
    const path = require('path');
    const mod = await WebAssembly.compile(
      readFileSync(path.join(__dirname, '../resources/elements.wasm'))
    );
    instance = await WebAssembly.instantiate(mod, go.importObject);
  } else {
    // web
    const elementsWasmBase64 = require('../resources/elements');
    var wasmBuffer = Uint8Array.from(atob(elementsWasmBase64.default), c =>
      c.charCodeAt(0)
    );
    const wasmBytes = await WebAssembly.compile(wasmBuffer);
    instance = await WebAssembly.instantiate(wasmBytes, go.importObject);
  }

  go.run(instance); // set go functions to JS global scope
}

function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function hexStringToBytes(str: string): Uint8Array {
  if (!str) {
    return new Uint8Array();
  }

  var a = [];
  for (var i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16));
  }

  return new Uint8Array(a);
}
