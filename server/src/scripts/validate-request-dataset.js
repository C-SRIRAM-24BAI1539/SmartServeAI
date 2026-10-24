
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFile);
const serverDirectory = path.resolve(scriptsDirectory, "../..");
const dataDirectory = path.join(serverDirectory, "data", "requests");

const expectedTotal = 6000;
const expectedPerProblem = 400;
const expectedTrainPerProblem = 320;
const expectedTestPerProblem = 80;

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const character = line[i];

    if (character === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }

  fields.push(field);
  return fields;
}

async function loadCsv(filename) {
  const content = await readFile(path.join(dataDirectory, filename), "utf8");
  const lines = content.trim().split(/\r?\n/);

  const headers = parseCsvLine(lines.shift());

  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

function countBy(rows, field) {
  const counts = new Map();

  for (const row of rows) {
    counts.set(row[field], (counts.get(row[field]) ?? 0) + 1);
  }

  return counts;
}

async function main() {
  const [allRows, trainRows, testRows] = await Promise.all([
    loadCsv("all.csv"),
    loadCsv("train.csv"),
    loadCsv("test.csv"),
  ]);

  const errors = [];
  const expectedHeaders = [
    "requestText",
    "categorySlug",
    "serviceName",
    "problemLabel",
    "split",
  ];

  if (allRows.length !== expectedTotal) {
    errors.push(`Expected ${expectedTotal} total rows, found ${allRows.length}.`);
  }

  if (trainRows.length !== 4800) {
    errors.push(`Expected 4800 training rows, found ${trainRows.length}.`);
  }

  if (testRows.length !== 1200) {
    errors.push(`Expected 1200 test rows, found ${testRows.length}.`);
  }

  for (const filename of ["all.csv", "train.csv", "test.csv"]) {
    const content = await readFile(path.join(dataDirectory, filename), "utf8");
    const firstLine = content.split(/\r?\n/, 1)[0];
    const headers = parseCsvLine(firstLine);

    if (headers.join("|") !== expectedHeaders.join("|")) {
      errors.push(`${filename} has unexpected CSV headers.`);
    }
  }

  const validCategories = new Set([
    "plumbing",
    "electrical",
    "ac-servicing",
    "carpentry",
    "appliance-repair",
  ]);

  const allRequestTexts = new Set();
  const trainTexts = new Set(trainRows.map((row) => row.requestText));
  const testTexts = new Set(testRows.map((row) => row.requestText));

  let missingFields = 0;
  let invalidCategories = 0;
  let duplicateRequests = 0;
  let incorrectSplits = 0;

  for (const row of allRows) {
    if (
      !row.requestText?.trim() ||
      !row.categorySlug?.trim() ||
      !row.serviceName?.trim() ||
      !row.problemLabel?.trim() ||
      !row.split?.trim()
    ) {
      missingFields += 1;
    }

    if (!validCategories.has(row.categorySlug)) {
      invalidCategories += 1;
    }

    const normalizedText = row.requestText.trim().toLowerCase();

    if (allRequestTexts.has(normalizedText)) {
      duplicateRequests += 1;
    }

    allRequestTexts.add(normalizedText);

    if (row.split !== "train" && row.split !== "test") {
      incorrectSplits += 1;
    }
  }

  for (const row of trainRows) {
    if (row.split !== "train") {
      incorrectSplits += 1;
    }
  }

  for (const row of testRows) {
    if (row.split !== "test") {
      incorrectSplits += 1;
    }
  }

  const overlap = [...trainTexts].filter((text) => testTexts.has(text)).length;
  const problemCounts = countBy(allRows, "problemLabel");
  const trainProblemCounts = countBy(trainRows, "problemLabel");
  const testProblemCounts = countBy(testRows, "problemLabel");

  for (const [problem, count] of problemCounts) {
    if (count !== expectedPerProblem) {
      errors.push(`${problem}: expected 400 examples, found ${count}.`);
    }

    if (trainProblemCounts.get(problem) !== expectedTrainPerProblem) {
      errors.push(`${problem}: unexpected training split count.`);
    }

    if (testProblemCounts.get(problem) !== expectedTestPerProblem) {
      errors.push(`${problem}: unexpected test split count.`);
    }
  }

  if (missingFields > 0) errors.push(`${missingFields} rows have missing fields.`);
  if (invalidCategories > 0) errors.push(`${invalidCategories} rows have invalid categories.`);
  if (duplicateRequests > 0) errors.push(`${duplicateRequests} duplicate request texts found.`);
  if (incorrectSplits > 0) errors.push(`${incorrectSplits} incorrect split labels found.`);
  if (overlap > 0) errors.push(`${overlap} exact requests appear in both train and test.`);

  console.log("\nSmartServe request dataset validation");
  console.log("-------------------------------------");
  console.log(`All rows: ${allRows.length}`);
  console.log(`Training rows: ${trainRows.length}`);
  console.log(`Test rows: ${testRows.length}`);
  console.log(`Problem types: ${problemCounts.size}`);
  console.log(`Missing-field rows: ${missingFields}`);
  console.log(`Invalid-category rows: ${invalidCategories}`);
  console.log(`Duplicate requests: ${duplicateRequests}`);
  console.log(`Train/test exact-text overlap: ${overlap}`);

  console.log("\nExamples per problem:");

  for (const [problem, count] of [...problemCounts].sort()) {
    console.log(
      `  ${problem}: ${count} total, ` +
      `${trainProblemCounts.get(problem) ?? 0} train, ` +
      `${testProblemCounts.get(problem) ?? 0} test`,
    );
  }

  if (errors.length > 0) {
    console.error("\nVALIDATION FAILED");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log("\nSTRUCTURAL VALIDATION PASSED");
  console.log(
    "Note: structural checks do not prove that examples are realistic " +
    "or that the test set measures generalization to new wording.",
  );
}

main().catch((error) => {
  console.error("Dataset validation failed:", error);
  process.exitCode = 1;
});
