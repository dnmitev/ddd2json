//go:build ignore

package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/traconiq/tachoparser/pkg/decoder"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: go run scripts/export-card-parse.go <card.DDD>")
		os.Exit(1)
	}

	data, err := os.ReadFile(os.Args[1])
	if err != nil {
		panic(err)
	}

	var card decoder.Card
	verified, err := decoder.UnmarshalTLV(data, &card)
	if err != nil {
		panic(err)
	}

	out := map[string]any{
		"mode":     "card",
		"verified": verified,
		"data":     card,
	}

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(out); err != nil {
		panic(err)
	}
}
