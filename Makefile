## help: prints this help message
help:
	@echo "Usage: \n"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

## wasm-loader: copy web assembly loader from go env
wasm-loader:
	@rm ./resources/wasm_exec.cjs || true
	@cp "$(GOROOT)/misc/wasm/wasm_exec.js" ./resources
	@mv ./resources/wasm_exec.js ./resources/wasm_exec.cjs	

## build-wallycore: craft the wallycore.js file from libwally-core submodule
build-wallycore:
	chmod +x ./scripts/compile.sh
	./scripts/compile.sh

## build-go: builds the go code to wasm
build-go:
	DOCKER_BUILDKIT=1 \
	docker build -f ./resources/Dockerfile.goelements --target wasm --output ./resources .

build: build-go build-wallycore
