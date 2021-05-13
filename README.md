# Pegin

TypeScript module to pegin Bitcoin into Liquid Bitcoin in the browser

## Build & Test

### Compile wasm wrappers

```sh
git submodule update --init 
# Enter the folder and pull secp as well
cd libwally-core
git submodule update --init
# Go back
cd ..
```

Build Go Elements and Libwally to WASM

```sh
make build
```

### Test

```sh
npm test
```

### Build the TS lib

```sh
npm run build
```


## Usage

```ts
import ElementsPegin from "pegin";

const peginModule = new ElementsPegin(
	await ElementsPegin.withGoElements(),
	await ElementsPegin.withLibwally(),
  // Optionals, defaults are dynfed is off, mainnet and hardcoded fedpeg script
  ElementsPegin.withDynamicFederation(false),
  ElementsPegin.withMainnet(),
  ElementsPegin.withFederationScript("my_Fed_Peg_Script_XXXYYYXXX"),
);

const address = await peginModule.getMainchainAddress(
  "0014efcee7e291eb23654650b3eb950fca21d01ee37e" // Liquid script
);

console.log(address); // Bitcoin address
```

## Project

- The Typescript lib entrypoint is `src/index.ts`.
- `resources/wallycore.js` is the compiled WebAssembly lib from LibwallyCore build using `resources/Dockerfile.libwally`.
- `resources/wasm_exec.js` is the WebAssembly runner for Golang.
- `elements.wasm` is compiled from wrappers in `main.go` using `resources/Dockerfile.goelements`.
- `elements.js` is the JavasScript glue with the base64 encoded wasm file packaged in the npm module.



## License

Distributed under the MIT License. See LICENSE for more information.
