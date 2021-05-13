## help: prints this help message
help:
	@echo "Usage: \n"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

## wasm-loader: copy web assembly loader from go env
wasm-loader:
	chmod +x ./scripts/pull_wasm_exec.sh
	./scripts/pull_wasm_exec.sh

## build-wallycore: craft the wallycore.js file from libwally-core submodule
build-wallycore:
	chmod +x ./scripts/compile.sh
	./scripts/compile.sh

## build-go: builds the go code to wasm
build-go:
	DOCKER_BUILDKIT=1 \
	docker build -f ./resources/Dockerfile.goelements --target wasm --output ./resources .

build: wasm-loader build-go build-wallycore
