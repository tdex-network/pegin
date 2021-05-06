## help: prints this help message
help:
	@echo "Usage: \n"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

## build: builds the go code to wasm
build: 
	GOOS=js GOARCH=wasm go build -o ./src/main.wasm ./main.go
	