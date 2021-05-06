# Pegin

TypeScript module to pegin Bitcoin into Liquid Bitcoin in the browser

## Usage

### Compile wasm wrappers

```
make build
```

### Test

```
yarn test
```

### Build

```
yarn build
```

```js
const peginModule = await loadPeginModule();
// peginModule exports claimWitnessScript, peginAddress and peginContract functions
```

## Project

- The Typescript lib entrypoint is `src/index.ts`.
- `src/lib/wallycore.js` is the compiled WebAssembly lib from LibwallyCore.
- `src/lib/wasm_exec.js` is the WebAssembly runner for Golang.
- `main.wasm` is compiled from wrappers in `main.go`.

## License

Distributed under the MIT License. See LICENSE for more information.
