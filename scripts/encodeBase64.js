const path = require("path");
const { readFileSync, writeFileSync } = require("fs");
const fileData = readFileSync(path.join(__dirname, "../resources/elements.wasm"));
const output = `export default "${fileData.toString('base64')}";`;
writeFileSync(path.join(__dirname, "../resources/elements.js"), output);
