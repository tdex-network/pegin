const lib = require("../resources/wallycore.js");

type WallycoreModuleOption = (mod: WallycoreModule) => void;

export class WallycoreModule {
  private wallycore: any;

  constructor(opt: WallycoreModuleOption) {
    opt(this);
  }

  private static async withWallycoreWasm(): Promise<WallycoreModuleOption> {
    const wallycore = await lib();
    return (mod: WallycoreModule) => {
      mod.wallycore = wallycore;
    }
  }

  public static async create(): Promise<WallycoreModule> {
    return new WallycoreModule(await WallycoreModule.withWallycoreWasm())
  }

  /**
 * get contract script hex (wrapper for wally_elements_pegin_contract_script_from_bytes)
 * @param redeemScript
 * @param script
 */
  peginContract(redeemScript: string, script: string): string {
    const redeemScriptBytes = hexStringToBytes(redeemScript);
    const scriptBytes = hexStringToBytes(script);

    const contractPtr = this.wallycore._malloc(redeemScriptBytes.length);
    const numOfBytesPtr = this.wallycore._malloc(4);

    const returnCode = this.wallycore.ccall(
      "wally_elements_pegin_contract_script_from_bytes",
      ["number"],
      [
        "array",
        "number",
        "array",
        "number",
        "number",
        "number",
        "number",
        "number"
      ],
      [
        redeemScriptBytes,
        redeemScriptBytes.length,
        scriptBytes,
        scriptBytes.length,
        0,
        contractPtr,
        redeemScriptBytes.length,
        numOfBytesPtr
      ]
    );

    if (returnCode !== 0) {
      throw new Error(
        `wally_elements_pegin_contract_script_from_bytes error: ${returnCode}`
      );
    }

    const written = this.wallycore.getValue(numOfBytesPtr)

    const contractString = toHexString(
      this.readBytes(contractPtr, written)
    );

    this.wallycore._free(contractPtr);
    this.wallycore._free(numOfBytesPtr);
    return contractString;
  }

  private readBytes(ptr: number, size: number): Uint8Array {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) bytes[i] = this.wallycore.getValue(ptr + i, "i8");
    return bytes;
  }
}

function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
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
