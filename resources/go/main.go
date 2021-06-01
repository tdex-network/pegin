package main

import (
	"encoding/hex"
	"errors"
	"syscall/js"

	"github.com/btcsuite/btcd/chaincfg"
	"github.com/vulpemventures/go-elements/elementsutil"
	"github.com/vulpemventures/go-elements/pegin"
)

var (
	invalidArgsError = errors.New("invalid number of arguments")
)

// main binds go wrappers to js global scope functions
func main() {
	js.Global().Set("mainChainAddress", MainChainAddressWrapper())
	js.Global().Set("claim", ClaimWrapper())

	select {} // prevents the function to stop
}

func ClaimWrapper() js.Func {
	return JSPromise(func(args []js.Value) (interface{}, error) {
		if len(args) != 10 {
			return nil, invalidArgsError
		}

		isMainnet := args[0].Bool()
		isDynamicFedEnabled := args[1].Bool()
		assetHashBytes, err := h2b(args[2].String())
		if err != nil {
			return nil, err
		}

		peggedAsset := append(
			[]byte{0x01},
			elementsutil.ReverseBytes(assetHashBytes)...,
		)

		parentGenesisBlockHash, err := h2b(args[3].String())
		if err != nil {
			return nil, err
		}

		fedPegScript, err := h2b(args[4].String())
		if err != nil {
			return nil, err
		}

		contract, err := h2b(args[5].String())
		if err != nil {
			return nil, err
		}

		btcTx, err := h2b(args[6].String())
		if err != nil {
			return nil, err
		}

		btcTxOutProof, err := h2b(args[7].String())
		if err != nil {
			return nil, err
		}

		claimScript, err := h2b(args[8].String())
		if err != nil {
			return nil, err
		}

		millisatPerByte := args[9].Float()

		btcNet := getBtcNetwork(isMainnet)

		tx, err := pegin.Claim(btcNet, isDynamicFedEnabled, peggedAsset, parentGenesisBlockHash, fedPegScript, contract, btcTx, btcTxOutProof, claimScript, millisatPerByte)

		if err != nil {
			return nil, err
		}

		return tx.ToHex()
	})
}

// MainChainAddressWrapper returns the js function for pegin.PeginAdress
func MainChainAddressWrapper() js.Func {
	return JSPromise(func(args []js.Value) (interface{}, error) {
		if len(args) != 4 {
			return nil, invalidArgsError
		}

		contract, err := h2b(args[0].String())
		if err != nil {
			return nil, err
		}

		fedPegScript, err := h2b(args[1].String())
		if err != nil {
			return nil, err
		}

		isDynamicFedEnabled := args[2].Bool()
		isMainnet := args[3].Bool()

		btcNet := getBtcNetwork(isMainnet)

		peginAddress, err := pegin.MainChainAddress(contract, btcNet, isDynamicFedEnabled, fedPegScript)
		if err != nil {
			return nil, err
		}

		return peginAddress, nil
	})
}

func getBtcNetwork(isMainnet bool) *chaincfg.Params {
	btcNet := &chaincfg.MainNetParams
	if !isMainnet {
		btcNet = &chaincfg.RegressionNetParams
	}
	return btcNet
}

// encodes bytes to hex
func b2h(buf []byte) string {
	return hex.EncodeToString(buf)
}

// decodes hex to bytes
func h2b(str string) ([]byte, error) {
	return hex.DecodeString(str)
}

type promise func(args []js.Value) (interface{}, error)

func JSPromise(fn promise) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// args[0] is a js.Value, so we need to get a string out of it
		handlerArgs := args
		handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			resolve := args[0]
			reject := args[1]

			go func() {

				data, err := fn(handlerArgs)
				if err != nil {
					errorConstructor := js.Global().Get("Error")
					errorObject := errorConstructor.New(err.Error())
					reject.Invoke(errorObject)
				}

				resolve.Invoke(data)
			}()

			// The handler of a Promise doesn't return any value
			return nil
		})

		// Create and return the Promise object
		promiseConstructor := js.Global().Get("Promise")
		return promiseConstructor.New(handler)
	})
}
