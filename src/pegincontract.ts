const lib = require("../resources/wallycore.js");

export async function wallycoreLoading() {
  const MAX_TRY = 10;
  let tryNumber = 0;
  while (MAX_TRY > tryNumber) {
    tryNumber++;
    await new Promise(resolve => setTimeout(resolve, 500));
    if (lib.asm !== undefined) return;
  }
}

/**
 * get contract script hex (wrapper for wally_elements_pegin_contract_script_from_bytes)
 * @param redeemScript
 * @param script
 */
export function peginContractScriptFromBytes(
  redeemScript: string,
  script: string
): string {
  const redeemScriptBytes = hexStringToBytes(redeemScript);
  const scriptBytes = hexStringToBytes(script);

  const contractPtr = lib._malloc(redeemScriptBytes.length);
  const numOfBytesPtr = lib._malloc(4);

  const returnCode = lib.ccall(
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

  const contractString = toHexString(
    readBytes(contractPtr, lib.getValue(numOfBytesPtr))
  );
  lib._free(contractPtr);
  lib._free(numOfBytesPtr);
  return contractString;
}

function readBytes(ptr: number, size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = lib.getValue(ptr + i, "i8");
  return bytes;
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
