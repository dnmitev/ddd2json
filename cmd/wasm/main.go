package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"syscall/js"

	"github.com/traconiq/tachoparser/pkg/decoder"
)

type parseResult struct {
	Mode     string      `json:"mode"`
	Verified bool        `json:"verified"`
	Score    int         `json:"score"`
	Data     interface{} `json:"data,omitempty"`
	Error    string      `json:"error,omitempty"`
}

type candidate struct {
	result parseResult
	err    error
}

func main() {
	js.Global().Set("ddd2jsonParse", js.FuncOf(parseDDD))
	select {}
}

func parseDDD(_ js.Value, args []js.Value) interface{} {
	if len(args) == 0 {
		return mustJSON(parseResult{Error: "missing DDD file bytes"})
	}

	input := args[0]
	if input.IsUndefined() || input.IsNull() {
		return mustJSON(parseResult{Error: "missing DDD file bytes"})
	}

	data := make([]byte, input.Get("byteLength").Int())
	js.CopyBytesToGo(data, input)

	fileName := ""
	if len(args) > 1 {
		fileName = args[1].String()
	}

	result := parseAuto(data, fileName)
	return mustJSON(result)
}

func parseAuto(data []byte, fileName string) parseResult {
	order := preferredModes(fileName, data)

	var best candidate
	for i, mode := range order {
		current := parseAs(data, mode)
		if current.err == nil && current.result.Score > 5 {
			return current.result
		}
		if i == 0 || current.result.Score > best.result.Score {
			best = current
		}
	}

	if best.err != nil {
		return parseResult{Error: fmt.Sprintf("could not parse DDD file: %v", best.err)}
	}
	if best.result.Score <= 0 {
		return parseResult{Error: "file was parsed, but no tachograph data was recognized"}
	}
	return best.result
}

func preferredModes(fileName string, data []byte) []string {
	upper := strings.ToUpper(fileName)
	if strings.HasPrefix(upper, "C_") {
		return []string{"card", "vu"}
	}
	if strings.HasPrefix(upper, "M_") || strings.HasPrefix(upper, "V_") {
		return []string{"vu", "card"}
	}
	if len(data) >= 2 && data[0] == 0x76 {
		return []string{"vu", "card"}
	}
	return []string{"vu", "card"}
}

func parseAs(data []byte, mode string) candidate {
	switch mode {
	case "vu":
		var value decoder.Vu
		verified, err := decoder.UnmarshalTV(data, &value)
		return candidate{
			result: parseResult{
				Mode:     mode,
				Verified: verified,
				Score:    score(value),
				Data:     value,
			},
			err: err,
		}
	case "card":
		var value decoder.Card
		verified, err := decoder.UnmarshalTLV(data, &value)
		return candidate{
			result: parseResult{
				Mode:     mode,
				Verified: verified,
				Score:    score(value),
				Data:     value,
			},
			err: err,
		}
	default:
		return candidate{err: fmt.Errorf("unknown parser mode %q", mode)}
	}
}

func score(value interface{}) int {
	payload, err := json.Marshal(value)
	if err != nil {
		return 0
	}

	var decoded interface{}
	if err := json.Unmarshal(payload, &decoded); err != nil {
		return 0
	}
	return scoreValue(decoded)
}

func scoreValue(value interface{}) int {
	switch v := value.(type) {
	case nil:
		return 0
	case bool:
		if v {
			return 1
		}
		return 0
	case float64:
		if v == 0 {
			return 0
		}
		return 1
	case string:
		if strings.TrimSpace(v) == "" {
			return 0
		}
		return 1
	case []interface{}:
		total := 0
		for _, item := range v {
			total += scoreValue(item)
		}
		if len(v) > 0 {
			total++
		}
		return total
	case map[string]interface{}:
		total := 0
		for _, item := range v {
			total += scoreValue(item)
		}
		return total
	default:
		return 0
	}
}

func mustJSON(result parseResult) string {
	payload, err := json.Marshal(result)
	if err != nil {
		fallback, _ := json.Marshal(parseResult{Error: err.Error()})
		return string(fallback)
	}
	return string(payload)
}

