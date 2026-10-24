
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFile);
const serverDirectory = path.resolve(scriptsDirectory, "../..");
const outputDirectory = path.join(serverDirectory, "data", "requests");

const EXAMPLES_PER_PROBLEM = 400;
const TRAIN_RATIO = 0.8;

const problems = [
  {
    categorySlug: "plumbing",
    serviceName: "Pipe and Tap Repair",
    problemLabel: "leaking_tap_or_pipe",
    objects: ["tap", "faucet", "water pipe", "kitchen tap", "bathroom tap"],
    symptoms: ["is leaking", "keeps dripping", "is leaking water continuously", "won't stop dripping"],
    requests: ["Please repair it.", "Can someone fix this?", "I need a plumber.", "Please arrange a repair visit."],
  },
  {
    categorySlug: "plumbing",
    serviceName: "Drainage Repair",
    problemLabel: "blocked_drain",
    objects: ["drain", "kitchen sink", "bathroom drain", "washbasin", "water outlet"],
    symptoms: ["is blocked", "drains very slowly", "is not letting water pass", "keeps filling with water"],
    requests: ["Please clear the blockage.", "I need drainage repair.", "Can someone inspect it?", "Please send a plumber."],
  },
  {
    categorySlug: "plumbing",
    serviceName: "Bathroom Plumbing",
    problemLabel: "bathroom_plumbing_issue",
    objects: ["bathroom water connection", "shower fitting", "toilet water connection", "bathroom tap fitting", "shower pipe"],
    symptoms: ["is not working properly", "has a water connection problem", "is loose", "is causing water leakage"],
    requests: ["Please repair the fitting.", "I need bathroom plumbing help.", "Can a plumber inspect it?", "Please arrange a visit."],
  },
  {
    categorySlug: "electrical",
    serviceName: "Electrical Fault Repair",
    problemLabel: "electrical_fault",
    objects: ["power supply", "electrical circuit", "room power", "house wiring", "electricity in one room"],
    symptoms: ["keeps cutting out", "has suddenly stopped working", "is having an electrical fault", "keeps tripping the breaker"],
    requests: ["Please send a qualified electrician.", "I need electrical fault repair.", "Can someone inspect it safely?", "Please arrange an electrician visit."],
  },
  {
    categorySlug: "electrical",
    serviceName: "Switch and Socket Repair",
    problemLabel: "faulty_switch_or_socket",
    objects: ["wall switch", "power socket", "electrical outlet", "plug point", "switchboard"],
    symptoms: ["has stopped working", "feels loose", "is not supplying power", "is damaged"],
    requests: ["Please repair it.", "I need an electrician.", "Can someone check the socket?", "Please arrange a repair."],
  },
  {
    categorySlug: "electrical",
    serviceName: "Lighting Installation",
    problemLabel: "lighting_problem",
    objects: ["ceiling light", "LED light", "room light", "light fixture", "wall lamp"],
    symptoms: ["is not turning on", "keeps flickering", "needs to be installed", "stops working randomly"],
    requests: ["Please fix the lighting.", "I need lighting service.", "Can an electrician check it?", "Please arrange a visit."],
  },
  {
    categorySlug: "ac-servicing",
    serviceName: "AC Cooling Repair",
    problemLabel: "ac_not_cooling",
    objects: ["air conditioner", "AC unit", "bedroom AC", "split AC", "home air conditioner"],
    symptoms: ["is running but not cooling", "blows warm air", "is cooling very poorly", "takes too long to cool the room"],
    requests: ["Please check the cooling problem.", "I need AC repair.", "Can a technician inspect it?", "Please arrange a service visit."],
  },
  {
    categorySlug: "ac-servicing",
    serviceName: "AC Water Leakage Repair",
    problemLabel: "ac_water_leak",
    objects: ["air conditioner", "indoor AC unit", "AC indoor unit", "bedroom AC", "split AC"],
    symptoms: ["is leaking water indoors", "is dripping water onto the floor", "has water coming from the indoor unit", "is leaking near the wall"],
    requests: ["Please fix the leak.", "I need AC leakage repair.", "Can a technician check it?", "Please arrange a repair visit."],
  },
  {
    categorySlug: "ac-servicing",
    serviceName: "AC Servicing",
    problemLabel: "routine_ac_maintenance",
    objects: ["air conditioner", "home AC", "split AC", "bedroom air conditioner", "AC unit"],
    symptoms: ["needs routine servicing", "has not been serviced for months", "needs a maintenance check", "needs cleaning and inspection"],
    requests: ["Please book routine maintenance.", "I need AC servicing.", "Can a technician visit?", "Please arrange an appointment."],
  },
  {
    categorySlug: "carpentry",
    serviceName: "Furniture Repair",
    problemLabel: "furniture_damage",
    objects: ["wooden chair", "table", "bed frame", "wooden furniture", "sofa frame"],
    symptoms: ["is broken", "has a loose part", "is damaged", "wobbles when I use it"],
    requests: ["Please repair it.", "I need a carpenter.", "Can someone inspect the damage?", "Please arrange a repair visit."],
  },
  {
    categorySlug: "carpentry",
    serviceName: "Door and Hinge Repair",
    problemLabel: "door_or_hinge_problem",
    objects: ["door", "door hinge", "main door", "bedroom door", "door handle"],
    symptoms: ["does not close properly", "makes a scraping noise", "has a loose hinge", "is difficult to open"],
    requests: ["Please fix the door.", "I need carpentry service.", "Can a carpenter inspect it?", "Please arrange a visit."],
  },
  {
    categorySlug: "carpentry",
    serviceName: "Cabinet Repair",
    problemLabel: "cabinet_or_drawer_problem",
    objects: ["kitchen cabinet", "drawer", "wardrobe door", "cabinet hinge", "wooden shelf"],
    symptoms: ["will not close properly", "has a broken hinge", "is loose", "is stuck when opening"],
    requests: ["Please repair it.", "I need a carpenter.", "Can someone fix the cabinet?", "Please arrange a repair."],
  },
  {
    categorySlug: "appliance-repair",
    serviceName: "Washing Machine Repair",
    problemLabel: "washing_machine_problem",
    objects: ["washing machine", "washer", "front-load washing machine", "top-load washer", "laundry machine"],
    symptoms: ["will not start", "is not draining water", "makes a loud noise", "stops during the wash cycle"],
    requests: ["Please repair the machine.", "I need appliance repair.", "Can a technician inspect it?", "Please arrange a service visit."],
  },
  {
    categorySlug: "appliance-repair",
    serviceName: "Refrigerator Repair",
    problemLabel: "refrigerator_cooling_problem",
    objects: ["refrigerator", "fridge", "home refrigerator", "freezer compartment", "refrigerator cooling system"],
    symptoms: ["is not cooling properly", "is getting warm inside", "is not keeping food cold", "has stopped cooling"],
    requests: ["Please check the cooling issue.", "I need refrigerator repair.", "Can an appliance technician visit?", "Please arrange a repair."],
  },
  {
    categorySlug: "appliance-repair",
    serviceName: "TV and Electronics Repair",
    problemLabel: "tv_display_or_electronics_problem",
    objects: ["TV", "television", "LED television", "home TV", "television screen"],
    symptoms: ["turns on but the screen stays black", "has no picture", "keeps restarting", "has a display problem"],
    requests: ["Please diagnose the problem.", "I need TV repair.", "Can an electronics technician inspect it?", "Please arrange a repair visit."],
  },
];

const openings = [
  (object, symptom) => `My ${object} ${symptom}`,
  (object, symptom) => `The ${object} ${symptom}`,
  (object, symptom) => `I have a problem because my ${object} ${symptom}`,
  (object, symptom) => `At home, the ${object} ${symptom}`,
  (object, symptom) => `Can you help? My ${object} ${symptom}`,
  (object, symptom) => `There is an issue: my ${object} ${symptom}`,
];

const closings = [
  (request) => `${request}`,
  (request) => ` ${request}`,
  (request) => `. ${request}`,
];

function seededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(items, random) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  const columns = [
    "requestText",
    "categorySlug",
    "serviceName",
    "problemLabel",
    "split",
  ];

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n") + "\n";
}

function createRequest(problem, index, random) {
  const object = problem.objects[Math.floor(random() * problem.objects.length)];
  const symptom = problem.symptoms[Math.floor(random() * problem.symptoms.length)];
  const opening = openings[Math.floor(random() * openings.length)];
  const request = problem.requests[Math.floor(random() * problem.requests.length)];
  const closing = closings[Math.floor(random() * closings.length)];

  const variants = [
    `${opening(object, symptom)}. ${request}`,
    `${opening(object, symptom)}. Please help.`,
    `${opening(object, symptom)}${closing(request)}`,
    `I need help with my ${object}. It ${symptom}. ${request}`,
    `Please help me fix this: the ${object} ${symptom}.`,
  ];

  const requestText = variants[Math.floor(random() * variants.length)]
    .replace(/\s+/g, " ")
    .trim();

  return {
    requestText,
    categorySlug: problem.categorySlug,
    serviceName: problem.serviceName,
    problemLabel: problem.problemLabel,
    index,
  };
}

async function main() {
  const random = seededRandom(20261011);
  const allRows = [];

  for (const problem of problems) {
    const problemRows = [];
    const seen = new Set();
    let attempts = 0;

    while (problemRows.length < EXAMPLES_PER_PROBLEM && attempts < 50000) {
      attempts += 1;
      const row = createRequest(problem, problemRows.length, random);
      const normalized = row.requestText.toLowerCase();

      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      problemRows.push(row);
    }

    if (problemRows.length < EXAMPLES_PER_PROBLEM) {
      throw new Error(
        `Could only generate ${problemRows.length} unique requests for ${problem.problemLabel}.`,
      );
    }

    const shuffled = shuffle(problemRows, random);
    const trainCount = Math.floor(EXAMPLES_PER_PROBLEM * TRAIN_RATIO);

    shuffled.forEach((row, index) => {
      allRows.push({
        ...row,
        split: index < trainCount ? "train" : "test",
      });
    });
  }

  const trainRows = allRows.filter((row) => row.split === "train");
  const testRows = allRows.filter((row) => row.split === "test");

  await mkdir(outputDirectory, { recursive: true });

  await Promise.all([
    writeFile(path.join(outputDirectory, "all.csv"), toCsv(allRows), "utf8"),
    writeFile(path.join(outputDirectory, "train.csv"), toCsv(trainRows), "utf8"),
    writeFile(path.join(outputDirectory, "test.csv"), toCsv(testRows), "utf8"),
  ]);

  console.log("Request dataset generated successfully.");
  console.log(`Problem types: ${problems.length}`);
  console.log(`Total requests: ${allRows.length}`);
  console.log(`Training requests: ${trainRows.length}`);
  console.log(`Test requests: ${testRows.length}`);
  console.log(`Output directory: ${outputDirectory}`);
  console.log("Files: all.csv, train.csv, test.csv");
}

main().catch((error) => {
  console.error("Dataset generation failed:", error);
  process.exitCode = 1;
});
