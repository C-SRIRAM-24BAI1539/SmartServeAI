import fs from "node:fs";
import path from "node:path";
import { classifyRequest } from "../modules/recommendations/request-classifier.js";

const csvPath = path.resolve("data/requests/test.csv");
const csv = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      if (row.some(v => v.trim())) rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }

  row.push(field);
  if (row.some(v => v.trim())) rows.push(row);

  const headers = rows.shift();
  return rows.map(values =>
    Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]))
  );
}

const records = parseCSV(csv);
let correctTypes = 0, correctCategories = 0, unclassified = 0;
const byType = {};

for (const record of records) {
  const prediction = classifyRequest(record.requestText);
  const expected = record.problemLabel;

  byType[expected] ??= { total: 0, correct: 0 };
  byType[expected].total++;

  if (!prediction) {
    unclassified++;
    continue;
  }

  if (prediction.problemType === expected) {
    correctTypes++;
    byType[expected].correct++;
  }

  if (prediction.categorySlug === record.categorySlug) {
    correctCategories++;
  }
}

const pct = (n, total) =>
  total ? `${(100 * n / total).toFixed(2)}%` : "0.00%";

console.log("\n=== SmartServe AI Classifier Evaluation ===");
console.log(`Test samples: ${records.length}`);
console.log(`Problem-type accuracy: ${pct(correctTypes, records.length)} (${correctTypes}/${records.length})`);
console.log(`Category accuracy: ${pct(correctCategories, records.length)} (${correctCategories}/${records.length})`);
console.log(`Unclassified: ${unclassified} (${pct(unclassified, records.length)})`);
console.log("\n=== Per-problem accuracy ===");

for (const type of Object.keys(byType).sort()) {
  const s = byType[type];
  console.log(`${type}: ${pct(s.correct, s.total)} (${s.correct}/${s.total})`);
}
