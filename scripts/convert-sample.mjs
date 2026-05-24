import fs from "node:fs";
import {
  convertParseResultToTachobox,
  summarizeTachobox,
  suggestOutputName,
} from "../public/converter.js";

const [, , inputPath, outputPath, sourceName = "tachograph.DDD"] = process.argv;

if (!inputPath || !outputPath) {
  console.error("usage: node scripts/convert-sample.mjs tachoparser.json tachobox.json [source-name]");
  process.exit(1);
}

const parseResult = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const tachoboxJson = convertParseResultToTachobox(parseResult, sourceName);
fs.writeFileSync(outputPath, `${JSON.stringify(tachoboxJson, null, 2)}\n`);

console.log(JSON.stringify({
  output: outputPath,
  suggestedName: suggestOutputName(sourceName),
  summary: summarizeTachobox(tachoboxJson),
}, null, 2));

