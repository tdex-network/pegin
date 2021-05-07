package main

import (
	"encoding/hex"
	"errors"
	"syscall/js"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/vulpemventures/go-elements/pegin"
)

var (
	invalidArgsError = errors.New("invalid number of arguments")
)

// main binds go wrappers to js global scope functions
func main() {
	js.Global().Set("peginAddress", PeginAddressWrapper())

	select {} // prevents the function to stop
}

// PeginAddressWrapper returns the js function for pegin.PeginAdress
func PeginAddressWrapper() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 4 {
			return withError(invalidArgsError)
		}

		contract, err := h2b(args[0].String())
		if err != nil {
			return withError(err)
		}

		fedPegScript, err := h2b(args[1].String())
		if err != nil {
			return withError(err)
		}

		isDynamicFedEnabled := args[2].Bool()
		isMainnet := args[3].Bool()

		var btcNet *chaincfg.Params = &chaincfg.MainNetParams
		if !isMainnet {
			btcNet = &chaincfg.RegressionNetParams
		}

		peginAddress, err := pegin.PeginAddress(contract, btcNet, isDynamicFedEnabled, fedPegScript)
		if err != nil {
			return withError(err)
		}

		return withResult(peginAddress)
	})
}

func withError(err error) map[string]interface{} {
	return map[string]interface{}{
		"error": err.Error(),
	}
}

func withResult(result interface{}) map[string]interface{} {
	return map[string]interface{}{
		"error":  nil,
		"result": result,
	}
}

// encodes bytes to hex
func b2h(buf []byte) string {
	return hex.EncodeToString(buf)
}

// decodes hex to bytes
func h2b(str string) ([]byte, error) {
	return hex.DecodeString(str)
}
