## help: prints this help message
help:
	@echo "Usage: \n"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

## wasm-loader: copy web assembly loader from go env
wasm-loader:
	@rm ./resources/wasm_exec.cjs || true
	@cp "$(GOROOT)/misc/wasm/wasm_exec.js" ./resources
	@mv ./resources/wasm_exec.js ./resources/wasm_exec.cjs	

## build: builds the go code to wasm
build: 
	GOOS=js GOARCH=wasm go build -o ./main.wasm ./main.go
	