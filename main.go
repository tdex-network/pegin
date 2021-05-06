package main

import (
	"encoding/hex"
	"syscall/js"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/vulpemventures/go-elements/network"
	"github.com/vulpemventures/go-elements/pegin"
)

// main binds go wrappers to js global scope functions
func main() {
	js.Global().Set("claimWitnessScript", ClaimWitnessScriptWrapper())
	js.Global().Set("peginAddress", PeginAddressWrapper())

	select {} // prevents the function to stop
}

// PeginAddressWrapper returns the js function for pegin.PeginAdress
func PeginAddressWrapper() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
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

// ClaimWitnessScriptWrapper returns the js function for pegin.ClaimWitnessScript
func ClaimWitnessScriptWrapper() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		var net *network.Network = &network.Liquid
		if !args[1].Bool() {
			net = &network.Regtest
		}

		publicKey, err := h2b(args[0].String())
		if err != nil {
			return withError(err)
		}

		claimScript, err := pegin.ClaimWitnessScript(publicKey, net)
		if err != nil {
			return withError(err)
		}

		return withResult(claimScript)
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
